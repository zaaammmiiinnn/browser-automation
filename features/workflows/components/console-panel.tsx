"use client"
import { useState } from "react"
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
function isSameSelection(a: ConsoleSelection, b: ConsoleSelection) {
  if (a.kind !== b.kind) return false
  if (a.runId !== b.runId) return false
  return a.kind === "step" && b.kind === "step" ? a.nodeId === b.nodeId : true
}
export function ConsolePanel() {
  const [selected, setSelected] = useState<ConsoleSelection | null>(null)
  const toggle = (selection: ConsoleSelection) => {
    setSelected((prev) =>
      prev && isSameSelection(prev, selection) ? null : selection
    )
  }
  return (
    <ResizablePanelGroup orientation="horizontal" className="size-full">
      <ResizablePanel minSize="12rem">
        <LogsPanel selected={selected} onSelect={toggle} />
      </ResizablePanel>
      {selected && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="20rem" minSize="12rem">
            <InspectorPanel selection={selected} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
