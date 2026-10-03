"use client"
import { useMemo, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import {
  LogsPanel,
  type ConsoleSelection,
} from "@/features/workflows/components/logs-panel"
import { useConsoleRuns } from "@/features/workflows/components/workflow-runs-provider"

function isSameSelection(a: ConsoleSelection, b: ConsoleSelection) {
  if (a.kind !== b.kind) return false
  if (a.runId !== b.runId) return false
  return a.kind === "step" && b.kind === "step" ? a.nodeId === b.nodeId : true
}

export function ConsolePanel() {
  const [selected, setSelected] = useState<ConsoleSelection | null>(null)
  const runs = useConsoleRuns()

  const latestRun = runs[0]
  const defaultStepNodeId = useMemo(() => {
    if (!latestRun?.steps.length) return null
    return (
      [...latestRun.steps]
        .reverse()
        .find((s) => s.output !== undefined || s.error)?.nodeId ??
      latestRun.steps[latestRun.steps.length - 1]?.nodeId ??
      null
    )
  }, [latestRun])

  const activeSelection: ConsoleSelection | null =
    selected ??
    (latestRun && defaultStepNodeId
      ? { kind: "step", runId: latestRun.id, nodeId: defaultStepNodeId }
      : null)

  const toggle = (selection: ConsoleSelection) => {
    setSelected((prev) =>
      prev && isSameSelection(prev, selection) ? null : selection
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
        No runs yet
      </div>
    )
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full">
      <ResizablePanel defaultSize="16rem" minSize="12rem">
        <LogsPanel selected={activeSelection} onSelect={toggle} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize="14rem">
        {activeSelection ? (
          <InspectorPanel selection={activeSelection} />
        ) : (
          <div className="flex size-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
            Select a step or replay to view output details
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

