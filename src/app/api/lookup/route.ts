import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidPublicIp, normalizeIp } from "@/lib/validate"
import { getRedisClient, buildCacheKey, CACHE_TTL } from "@/lib/redis"
import { fetchIpInfo } from "@/lib/ipinfo"
import type { IpLookupResult } from "@/types/ip"

const QuerySchema = z.object({
  ip: z.string().min(1, "ip parameter is required"),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const parseResult = QuerySchema.safeParse({ ip: req.nextUrl.searchParams.get("ip") })

  if (!parseResult.success) {
    return NextResponse.json({ error: "Missing ip parameter" }, { status: 400 })
  }

  const ip = normalizeIp(parseResult.data.ip)

  if (!isValidPublicIp(ip)) {
    return NextResponse.json(
      { error: "Invalid or private IP address" },
      { status: 422 },
    )
  }

  try {
    const redis = await getRedisClient()
    const cacheKey = buildCacheKey(ip)
    const cached = await redis.get(cacheKey)

    if (cached) {
      return NextResponse.json(JSON.parse(cached) as IpLookupResult)
    }

    const result = await fetchIpInfo(ip)
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result))

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed"
    console.error("IP lookup error:", { ip, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
