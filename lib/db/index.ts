import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"
function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  const sql = neon(process.env.DATABASE_URL)
  return drizzle({ client: sql, schema, casing: "snake_case" })
}
type DbInstance = ReturnType<typeof createDb>
let _db: DbInstance | null = null
function getDb(): DbInstance {
  if (!_db) {
    _db = createDb()
  }
  return _db
}
export const db = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
export { schema }
