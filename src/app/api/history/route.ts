import { NextResponse } from "next/server"
import { getRecentLookups } from "@/lib/history"

export async function GET(): Promise<NextResponse> {
  try {
    const lookups = await getRecentLookups(10)
    return NextResponse.json(lookups)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history"
    console.error("History fetch error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
