import * as Sentry from "@sentry/nextjs"
import { auth } from "@clerk/nextjs/server"
import { NotFoundError } from "@browserbasehq/sdk"
import { browserbase } from "@/lib/browserbase"
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      sessionId: string
    }>
  }
) {
  const { userId, orgId, has } = await auth()
  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }
  const { sessionId } = await params
  Sentry.getIsolationScope().setAttributes({
    route: "GET /api/replays/[sessionId]",
    userId,
    orgId,
    sessionId,
  })
  if (!has({ plan: "pro" })) {
    Sentry.logger.warn("Session replay denied — Pro plan required", {
      orgId,
      sessionId,
    })
    return new Response("Pro plan required", { status: 403 })
  }
  try {
    const replay = await browserbase.sessions.replays.retrieve(sessionId)
    const firstPage = replay.pages[0]
    if (!firstPage) {
      return new Response(null, { status: 202 })
    }
    const playlist = await browserbase.sessions.replays.retrievePage(
      sessionId,
      firstPage.pageId
    )
    const m3u8 = await playlist.text()
    Sentry.logger.info("Session replay served", {
      sessionId,
      orgId,
      pageCount: replay.pages.length,
    })
    return new Response(m3u8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return new Response(null, { status: 202 })
    }
    throw error
  }
}
