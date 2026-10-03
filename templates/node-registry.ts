import type { Node } from "@xyflow/react"
import { Globe, MousePointerClick, type LucideIcon } from "lucide-react"
export type StepNodeKind = "trigger" | "action"
export type NodeField = {
  key: string
  label: string
  placeholder?: string
}
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string
  fields: NodeField[]
}
export const nodeRegistry = {
  start: {
    type: "start",
    kind: "trigger",
    label: "Start",
    icon: MousePointerClick,
    accent: "bg-blue-500 text-white",
    fields: [],
  },
  "open-url": {
    type: "open-url",
    kind: "action",
    label: "Open URL",
    icon: Globe,
    accent: "bg-emerald-500 text-white",
    fields: [{ key: "url", label: "URL", placeholder: "https://youtube.com" }],
  },
} satisfies Record<string, NodeDefinition>
export type NodeType = keyof typeof nodeRegistry
export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}
export type StepNodeType = Node<StepNodeData, "step">
