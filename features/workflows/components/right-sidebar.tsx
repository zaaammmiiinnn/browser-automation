"use client"
import { useState, useTransition } from "react"
import { useReactFlow, useStore } from "@xyflow/react"
import { Lock, MoreHorizontal, Play, Square, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  cancelWorkflowRunAction,
  deleteWorkflowAction,
  runWorkflowAction,
} from "@/features/workflows/actions"
import { NodeIcon } from "@/features/workflows/components/node-icon"
import { useLiveRun } from "@/features/workflows/components/workflow-runs-provider"
import { useProPlan } from "@/features/workflows/hooks/use-pro-plan"
import { useUpstreamConnections } from "@/features/workflows/hooks/use-upstream-connections"
import { validateGraph } from "@/features/workflows/lib/validate-graph"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
function Field({
  field,
  value,
  onChange,
  onFocus,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus: () => void
}) {
  if (field.multiline) {
    return (
      <Textarea
        id={field.key}
        value={value}
        placeholder={field.placeholder}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <Input
      id={field.key}
      value={value}
      placeholder={field.placeholder}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections()
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)
  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }
  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]
  const targetKey = activeFieldKey ?? def.fields[0]?.key
  const insertToken = (token: string) => {
    if (!targetKey) return
    updateNodeData(node.id, {
      values: { ...values, [targetKey]: (values[targetKey] ?? "") + token },
    })
  }
  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Field
                field={field}
                value={values[field.key] ?? ""}
                onFocus={() => setActiveFieldKey(field.key)}
                onChange={(value) => {
                  updateNodeData(node.id, {
                    values: { ...values, [field.key]: value },
                  })
                }}
              />
            </div>
          ))
        )}

        {connections.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Connections</Label>
            <div className="flex flex-wrap gap-1.5">
              {connections.map((connection) => (
                <button
                  key={connection.token}
                  type="button"
                  onClick={() => insertToken(connection.token)}
                  className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-1 text-xs hover:bg-accent"
                >
                  <NodeIcon type={connection.nodeType} className="size-4" />
                  <span className="truncate">{connection.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
const sections: {
  kind: StepNodeKind
  label: string
}[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]
const definitions = Object.values(nodeRegistry)
const premiumNodes = new Set<NodeType>(["agent"])
function Palette() {
  const { getNodes, getViewport, addNodes } = useReactFlow<StepNodeType>()
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const { isLoaded, isPro, goToUpgrade } = useProPlan()
  const isLocked = (type: NodeType) =>
    premiumNodes.has(type) && isLoaded && !isPro
  const add = (type: NodeType) => {
    if (isLocked(type)) {
      goToUpgrade()
      return
    }
    const def = nodeRegistry[type]
    const nodes = getNodes()
    if (
      def.kind === "trigger" &&
      nodes.some((n) => n.data.kind === "trigger")
    ) {
      toast.error("A workflow can only have one trigger.")
      return
    }
    const count = nodes.filter((n) => n.data.type === type).length
    const title = `${def.label} ${count + 1}`
    const { x, y, zoom } = getViewport()
    const position = {
      x: (width / 2 - x) / zoom,
      y: (height / 2 - y) / zoom,
    }
    addNodes({
      id: crypto.randomUUID(),
      type: "step",
      position,
      data: { type, kind: def.kind, title, values: {} },
    })
  }
  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => {
                  const type = def.type as NodeType
                  const locked = isLocked(type)
                  return (
                    <Button
                      key={def.type}
                      variant="ghost"
                      onClick={() => add(type)}
                      title={
                        locked ? "Upgrade to Pro to add this node" : undefined
                      }
                      className="justify-start gap-2.5 px-1.5 text-xs"
                    >
                      <NodeIcon type={type} />
                      {def.label}
                      {locked && (
                        <Lock className="ml-auto size-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  )
                })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}
function ActionsMenu({ workflowId }: { workflowId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          onSelect={(e) => {
            e.preventDefault()
            startTransition(async () => {
              try {
                await deleteWorkflowAction(workflowId)
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Couldn't delete workflow."
                toast.error(message)
              }
            })
          }}
        >
          <Trash2 />
          Delete workflow
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
function RunButton({ workflowId }: { workflowId: string }) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const [isPending, startTransition] = useTransition()
  const liveRun = useLiveRun()
  if (liveRun) {
    return (
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              await cancelWorkflowRunAction(liveRun.id)
            } catch {
              toast.error("Couldn't stop the run.")
            }
          })
        }}
      >
        <Square fill="currentColor" />
        Stop
      </Button>
    )
  }
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}
      onClick={() => {
        const graph = { nodes: getNodes(), edges: getEdges() }
        const problems = validateGraph(graph)
        if (problems.length > 0) {
          toast.error(problems[0])
          return
        }
        startTransition(async () => {
          try {
            await runWorkflowAction({ id: workflowId, graph })
            toast.success("Workflow run started")
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Couldn't start the run."
            toast.error(message)
          }
        })
      }}
    >
      <Play fill="primary" />
      {isPending ? "Starting..." : "Run"}
    </Button>
  )
}
export function RightSidebar({ workflowId }: { workflowId: string }) {
  const [tab, setTab] = useState("toolbar")
  const selected = useStore((s) => s.nodes.find((n) => n.selected)) as
    StepNodeType | undefined
  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if (selected && selected.id !== prevSelectedId) {
    setPrevSelectedId(selected.id)
    setTab("editor")
  }
  return (
    <div className="flex size-full flex-col bg-background">
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector key={selected?.id} node={selected} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
