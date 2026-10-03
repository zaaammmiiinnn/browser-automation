import * as Sentry from "@sentry/nextjs"
import { auth, currentUser } from "@clerk/nextjs/server"
import { liveblocks } from "@/lib/liveblocks"
export async function POST() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }
  const user = await currentUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }
  Sentry.getIsolationScope().setAttributes({
    route: "POST /api/liveblocks/auth",
    userId,
    orgId,
  })
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "LIVEBLOCKS_SECRET_KEY is not set" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
  try {
    const { status, body } = await liveblocks.identifyUser(
      {
        userId,
        groupIds: [orgId],
        organizationId: orgId,
      },
      {
        userInfo: {
          name:
            user.fullName ??
            user.username ??
            user.primaryEmailAddress?.emailAddress ??
            "Anonymous",
          avatar: user.imageUrl,
        },
      }
    )
    if (status >= 400) {
      Sentry.logger.error("Liveblocks user identification failed", {
        userId,
        orgId,
        status,
      })
    } else {
      Sentry.logger.info("Liveblocks user identified", {
        userId,
        orgId,
        status,
      })
    }
    return new Response(body, { status })
  } catch (error) {
    Sentry.logger.error("Liveblocks auth failed", { error, userId, orgId })
    return new Response(
      JSON.stringify({ error: "Failed to authenticate with Liveblocks" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
