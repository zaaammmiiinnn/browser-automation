import fs from "fs"
import path from "path"
import crypto from "crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { Workflow, WorkflowGraph, workflows } from "@/lib/db/schema"
import { validateGraph } from "@/features/workflows/lib/validate-graph"
const DATA_DIR = path.join(process.cwd(), ".data")
const DATA_FILE = path.join(DATA_DIR, "workflows.json")
function getLocalWorkflows(): Workflow[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8")
    type StoredWorkflow = Omit<Workflow, "createdAt" | "updatedAt"> & {
      createdAt: string | Date
      updatedAt: string | Date
    }
    const list = JSON.parse(raw) as StoredWorkflow[]
    return list.map((w) => ({
      ...w,
      createdAt: new Date(w.createdAt),
      updatedAt: new Date(w.updatedAt),
    }))
  } catch (e) {
    console.error("Failed to read local workflows fallback:", e)
    return []
  }
}
function saveLocalWorkflows(list: Workflow[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to save local workflows fallback:", e)
  }
}
export async function saveWorkflowGraph({
  orgId,
  id,
  graph,
}: {
  orgId: string
  id: string
  graph: WorkflowGraph
}) {
  const problems = validateGraph(graph)
  if (problems.length > 0) throw new Error(problems.join(" "))
  if (process.env.DATABASE_URL) {
    await db
      .update(workflows)
      .set({ graph, updatedAt: new Date() })
      .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    return
  }
  const items = getLocalWorkflows()
  const target = items.find((w) => w.id === id && w.orgId === orgId)
  if (target) {
    target.graph = graph
    target.updatedAt = new Date()
    saveLocalWorkflows(items)
  }
}
export async function listWorkflows(orgId: string): Promise<Workflow[]> {
  if (process.env.DATABASE_URL) {
    return db
      .select()
      .from(workflows)
      .where(eq(workflows.orgId, orgId))
      .orderBy(desc(workflows.createdAt))
  }
  return getLocalWorkflows()
    .filter((w) => w.orgId === orgId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
export async function getWorkflow(
  orgId: string,
  id: string
): Promise<Workflow | undefined> {
  if (process.env.DATABASE_URL) {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
    return workflow
  }
  return getLocalWorkflows().find((w) => w.id === id && w.orgId === orgId)
}
export async function createWorkflow(
  orgId: string,
  name: string
): Promise<Workflow> {
  if (process.env.DATABASE_URL) {
    const [workflow] = await db
      .insert(workflows)
      .values({ orgId, name })
      .returning()
    return workflow
  }
  const newWorkflow: Workflow = {
    id: crypto.randomUUID(),
    orgId,
    name,
    graph: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const items = getLocalWorkflows()
  items.unshift(newWorkflow)
  saveLocalWorkflows(items)
  return newWorkflow
}
export async function deleteWorkflow(
  orgId: string,
  id: string
): Promise<Workflow | undefined> {
  if (process.env.DATABASE_URL) {
    const [workflow] = await db
      .delete(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
      .returning()
    return workflow
  }
  const items = getLocalWorkflows()
  const idx = items.findIndex((w) => w.id === id && w.orgId === orgId)
  if (idx !== -1) {
    const [deleted] = items.splice(idx, 1)
    saveLocalWorkflows(items)
    return deleted
  }
  return undefined
}
