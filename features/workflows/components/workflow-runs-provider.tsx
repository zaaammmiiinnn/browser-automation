"use client"
import { createContext, useContext, useMemo } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"
import type {
  RunStep,
  runWorkflowTask,
} from "@/features/workflows/tasks/run-workflow"
type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]
interface WorkflowRunsContextValue {
  runs: WorkflowRun[]
  error?: Error
}
const WorkflowRunsContext = createContext<WorkflowRunsContextValue | null>(null)
interface WorkflowRunsProviderProps {
  workflowId: string
  accessToken?: string
  children: React.ReactNode
}
export function WorkflowRunsProvider({
  workflowId,
  accessToken,
  children,
}: WorkflowRunsProviderProps) {
  const { runs, error } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    { accessToken, enabled: Boolean(accessToken) }
  )
  const value = useMemo<WorkflowRunsContextValue>(
    () => ({ runs, error }),
    [runs, error]
  )
  return (
    <WorkflowRunsContext.Provider value={value}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}
function useWorkflowRuns() {
  const ctx = useContext(WorkflowRunsContext)
  if (!ctx) {
    throw new Error(
      "useWorkflowRuns must be used within a WorkflowRunsProvider"
    )
  }
  return ctx
}
function isRunLive(run: WorkflowRun): boolean {
  return run.status === "QUEUED" || run.status === "EXECUTING"
}
function stepsForRun(run: WorkflowRun): RunStep[] {
  const metadataSteps = run.metadata?.steps as RunStep[] | undefined
  return run.output?.steps ?? metadataSteps ?? []
}
interface LatestRunSteps {
  steps: RunStep[]
  isLive: boolean
}
export function useLatestRunSteps(): LatestRunSteps {
  const { runs } = useWorkflowRuns()
  return useMemo<LatestRunSteps>(() => {
    const latest = runs.reduce<WorkflowRun | undefined>((newest, run) => {
      if (!newest) return run
      const runTime = new Date(run.createdAt).getTime()
      const newestTime = new Date(newest.createdAt).getTime()
      if (runTime > newestTime) return run
      return newest
    }, undefined)
    if (!latest) return { steps: [], isLive: false }
    return { steps: stepsForRun(latest), isLive: isRunLive(latest) }
  }, [runs])
}
export function useLiveRun(): WorkflowRun | undefined {
  const { runs } = useWorkflowRuns()
  return useMemo(() => runs.find(isRunLive), [runs])
}
function sessionIdForRun(run: WorkflowRun): string | undefined {
  return run.output?.browserbaseSessionId
}
export interface ConsoleRun {
  id: string
  status: WorkflowRun["status"]
  createdAt: Date
  isLive: boolean
  steps: RunStep[]
  browserbaseSessionId?: string
}
export function useConsoleRuns(): ConsoleRun[] {
  const { runs } = useWorkflowRuns()
  return useMemo<ConsoleRun[]>(
    () =>
      [...runs]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((run) => ({
          id: run.id,
          status: run.status,
          createdAt: new Date(run.createdAt),
          isLive: isRunLive(run),
          steps: stepsForRun(run),
          browserbaseSessionId: sessionIdForRun(run),
        })),
    [runs]
  )
}
