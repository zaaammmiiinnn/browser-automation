import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { liveblocks } from "@/lib/liveblocks"
import { getWorkflow } from "@/features/workflows/data"
import { Room } from "@/features/workflows/components/room"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"
export default async function Page({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params
  const { orgId } = await auth()
  if (!orgId) notFound()
  const workflow = await getWorkflow(orgId, id)
  if (!workflow) notFound()
  if (process.env.LIVEBLOCKS_SECRET_KEY) {
    try {
      await liveblocks.getOrCreateRoom(id, {
        organizationId: orgId,
        defaultAccesses: [],
        groupsAccesses: {
          [orgId]: ["room:write"],
        },
        metadata: {
          title: workflow.name,
        },
      })
    } catch (err) {
      console.error("Failed to get or create Liveblocks room:", err)
    }
  }
  let runsToken: string | undefined
  if (process.env.TRIGGER_SECRET_KEY) {
    try {
      runsToken = await triggerAuth.createPublicToken({
        scopes: {
          read: {
            tags: [`workflow:${id}`],
          },
        },
        expirationTime: "1hr",
      })
    } catch (err) {
      console.error("Failed to mint Trigger.dev public token:", err)
    }
  }
  const hasLiveblocks = Boolean(process.env.LIVEBLOCKS_SECRET_KEY)
  return (
    <Room roomId={id} hasLiveblocks={hasLiveblocks}>
      <ReactFlowProvider>
        <WorkflowRunsProvider workflowId={id} accessToken={runsToken}>
          <WorkflowShell workflowId={id} initialGraph={workflow.graph} />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}
