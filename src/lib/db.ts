import { Pool } from "pg"

const globalForPg = global as typeof globalThis & { _pgPool?: Pool }

export function getDb(): Pool {
  if (!globalForPg._pgPool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not configured")
    globalForPg._pgPool = new Pool({ connectionString: url })
  }
  return globalForPg._pgPool
}

let schemaReady = false

export async function ensureSchema(): Promise<void> {
  if (schemaReady) return
  const db = getDb()
  await db.query(`
    CREATE TABLE IF NOT EXISTS lookups (
      id          SERIAL PRIMARY KEY,
      query       TEXT        NOT NULL,
      resolved_ip TEXT        NOT NULL,
      country     TEXT,
      city        TEXT,
      org         TEXT,
      looked_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  schemaReady = true
}
