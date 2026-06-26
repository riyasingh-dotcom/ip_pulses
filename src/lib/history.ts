import { getDb, ensureSchema } from "./db"
import type { LookupHistoryItem } from "@/types/ip"

type NewLookup = Omit<LookupHistoryItem, "id" | "looked_up_at">

export async function logLookup(item: NewLookup): Promise<void> {
  await ensureSchema()
  const db = getDb()
  await db.query(
    `INSERT INTO lookups (query, resolved_ip, country, city, org)
     VALUES ($1, $2, $3, $4, $5)`,
    [item.query, item.resolved_ip, item.country, item.city, item.org],
  )
}

export async function getRecentLookups(limit = 10): Promise<LookupHistoryItem[]> {
  await ensureSchema()
  const db = getDb()
  const result = await db.query<LookupHistoryItem>(
    `SELECT id, query, resolved_ip, country, city, org, looked_up_at
     FROM lookups
     ORDER BY looked_up_at DESC
     LIMIT $1`,
    [limit],
  )
  return result.rows
}
