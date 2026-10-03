import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"
import type { DeserializedJson } from "@trigger.dev/core"
import { Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "@/features/workflows/nodes/node-executors"
import {
  interpolate,
  type NodeOutputs,
} from "@/features/workflows/lib/interpolate"
import { getWorkflow } from "@/features/workflows/data"
import type { NodeType } from "@/features/workflows/nodes/node-registry"
import type { WorkflowGraph } from "@/lib/db/schema"
export type RunStep = {
  nodeId: string
  type: NodeType
  title: string
  status: "pending" | "running" | "done" | "failed"
  durationMs?: number
  output?: unknown
  error?: string
}
export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({
    workflowId,
    orgId,
    graph: passedGraph,
    browserbaseApiKey: passedBrowserbaseApiKey,
  }: {
    workflowId: string
    orgId: string
    graph?: WorkflowGraph
    browserbaseApiKey?: string
  }) => {
    let graph = passedGraph
    let workflowName = "Workflow"
    if (!graph) {
      const workflow = await getWorkflow(orgId, workflowId)
      graph = workflow?.graph ?? undefined
      if (workflow?.name) workflowName = workflow.name
    }
    if (!graph) throw new Error(`Workflow ${workflowId} has no graph`)
    const { nodes, edges } = graph
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))
    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))
    logger.log(`Running workflow ${workflowName}`, { steps: order.length })
    const steps: RunStep[] = order.map((nodeId) => {
      const node = byId.get(nodeId)!
      return {
        nodeId,
        type: node.data.type,
        title: node.data.title,
        status: "pending",
      }
    })
    const publishSteps = () =>
      metadata.set("steps", steps as unknown as DeserializedJson[])
    publishSteps()
    let stagehand: Stagehand | undefined
    let browserbaseSessionId: string | undefined
    let simulatedPageUrl = "https://example.com"
    let simulatedPageTitle = "Example Domain"
    const getStagehand = async () => {
      if (stagehand) return stagehand
      const browserbaseKey =
        process.env.BROWSERBASE_API_KEY || passedBrowserbaseApiKey
      if (browserbaseKey) {
        stagehand = new Stagehand({
          env: "BROWSERBASE",
          apiKey: browserbaseKey,
          model: "google/gemini-2.5-flash",
          disablePino: true,
        })
        await stagehand.init()
        browserbaseSessionId = stagehand.browserbaseSessionID
        return stagehand
      }
      const mockStagehand = {
        browserbaseSessionID: undefined,
        context: {
          pages: () => [
            {
              url: () => simulatedPageUrl,
              title: async () => simulatedPageTitle,
              goto: async (url: string) => {
                simulatedPageUrl = url
                try {
                  const parsed = new URL(url)
                  simulatedPageTitle = `${parsed.hostname} (Simulated)`
                } catch {
                  simulatedPageTitle = url
                }
                await new Promise((r) => setTimeout(r, 1000))
              },
            },
          ],
        },
        async init() {
          await new Promise((r) => setTimeout(r, 500))
        },
        async act(instruction: string) {
          await new Promise((r) => setTimeout(r, 1000))
          return {
            success: true,
            message: `Action completed: ${instruction}`,
          }
        },
        async observe(instruction: string) {
          await new Promise((r) => setTimeout(r, 1000))
          return [
            {
              selector: "button.action",
              description: `Observed match for: ${instruction}`,
            },
          ]
        },
        async extract(instruction: string) {
          await new Promise((r) => setTimeout(r, 1000))
          return {
            extraction: `Extracted data for: ${instruction}`,
          }
        },
        agent() {
          return {
            execute: async (instruction: string) => {
              await new Promise((r) => setTimeout(r, 1200))
              return {
                success: true,
                message: `Agent execution finished: ${instruction}`,
                completed: true,
              }
            },
          }
        },
        async close() {},
      }
      stagehand = mockStagehand as unknown as Stagehand
      return stagehand
    }
    const outputs: NodeOutputs = {}
    for (let i = 0; i < order.length; i++) {
      const id = order[i]
      const step = steps[i]
      const node = byId.get(id)!
      logger.log(`Running step: ${node.data.title}`)
      const executor = nodeExecutors[node.data.type]
      if (!executor) {
        step.status = "done"
        publishSteps()
        continue
      }
      step.status = "running"
      publishSteps()
      await metadata.flush()
      const values = Object.fromEntries(
        Object.entries(node.data.values).map(([key, text]) => [
          key,
          interpolate({ text, outputs }),
        ])
      )
      const startedAt = Date.now()
      try {
        const output = await executor({ values, getStagehand })
        outputs[id] = output
        step.output = output
      } catch (error) {
        step.status = "failed"
        step.durationMs = Date.now() - startedAt
        step.error = error instanceof Error ? error.message : String(error)
        publishSteps()
        await metadata.flush()
        await stagehand?.close()
        throw error
      }
      step.status = "done"
      step.durationMs = Date.now() - startedAt
      publishSteps()
    }
    await stagehand?.close()
    return { steps, browserbaseSessionId }
  },
})
