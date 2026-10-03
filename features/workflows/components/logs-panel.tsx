"use client"
import prettyMilliseconds from "pretty-ms"
import { Lock, MonitorPlay } from "lucide-react"
import { cn } from "@/lib/utils"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import {
  useConsoleRuns,
  type ConsoleRun,
} from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"
export interface StepSelection {
  kind: "step"
  runId: string
  nodeId: string
}
export interface ReplaySelection {
  kind: "replay"
  runId: string
}
export type ConsoleSelection = StepSelection | ReplaySelection
function StepRow({
  run,
  step,
  isSelected,
  onSelect,
}: {
  run: ConsoleRun
  step: RunStep
  isSelected: boolean
  onSelect: (selection: StepSelection) => void
}) {
  const isRunning = step.status === "running" && run.isLive
  const isFailed = step.status === "failed"
  const isInactive = step.status === "pending"
  return (
    <button
      type="button"
      onClick={() =>
        onSelect({ kind: "step", runId: run.id, nodeId: step.nodeId })
      }
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-accent",
        isSelected && "bg-accent",
        isInactive && "opacity-50"
      )}
    >
      <NodeIcon type={step.type} running={isRunning} />
      <span
        className={cn("truncate font-medium", isFailed && "text-destructive")}
      >
        {step.title}
      </span>
      {step.durationMs != null && (
        <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
          {prettyMilliseconds(step.durationMs)}
        </span>
      )}
    </button>
  )
}
function ReplayRow({
  run,
  isSelected,
  onSelect,
}: {
  run: ConsoleRun
  isSelected: boolean
  onSelect: (selection: ReplaySelection) => void
}) {
  const { isLoaded, isPro, goToUpgrade } = useProPlan()
  const isLocked = isLoaded && !isPro
  return (
    <button
      type="button"
      onClick={() =>
        isLocked ? goToUpgrade() : onSelect({ kind: "replay", runId: run.id })
      }
      title={isLocked ? "Upgrade to Pro to watch replays" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <MonitorPlay className="size-3.5" />
      </span>
      <span className="truncate font-medium">Replay</span>
      {isLocked && (
        <Lock className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      )}
    </button>
  )
}
export function LogsPanel({
  selected,
  onSelect,
}: {
  selected: ConsoleSelection | null
  onSelect: (selection: ConsoleSelection) => void
}) {
  const runs = useConsoleRuns()
  if (runs.length === 0) {
    return (
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
        No runs yet
      </div>
    )
  }
  return (
    <div className="flex size-full flex-col gap-3 overflow-y-auto p-2">
      {runs.map((run) => (
        <div key={run.id} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
            <span>{run.createdAt.toLocaleTimeString()}</span>
            <span className="lowercase">{run.status}</span>
          </div>
          {run.steps.map((step) => (
            <StepRow
              key={step.nodeId}
              run={run}
              step={step}
              isSelected={
                selected?.kind === "step" &&
                selected.runId === run.id &&
                selected.nodeId === step.nodeId
              }
              onSelect={onSelect}
            />
          ))}

          {run.browserbaseSessionId && !run.isLive && (
            <ReplayRow
              run={run}
              isSelected={
                selected?.kind === "replay" && selected.runId === run.id
              }
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </div>
  )
}
