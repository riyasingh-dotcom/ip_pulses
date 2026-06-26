import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isValidPublicIp, isValidDomain, normalizeIp } from "@/lib/validate"
import { getRedisClient, buildCacheKey, CACHE_TTL } from "@/lib/redis"
import { fetchIpInfo } from "@/lib/ipinfo"
import { resolveDomain } from "@/lib/dns"
import type { IpLookupResult } from "@/types/ip"

const QuerySchema = z.object({
  ip: z.string().min(1, "ip parameter is required"),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const parseResult = QuerySchema.safeParse({ ip: req.nextUrl.searchParams.get("ip") })

  if (!parseResult.success) {
    return NextResponse.json({ error: "Missing ip parameter" }, { status: 400 })
  }

  const query = normalizeIp(parseResult.data.ip)

  let ip: string
  let resolvedFrom: string | undefined

  if (isValidPublicIp(query)) {
    ip = query
  } else if (isValidDomain(query)) {
    try {
      ip = await resolveDomain(query)
      resolvedFrom = query
    } catch {
      return NextResponse.json(
        { error: `Could not resolve domain: ${query}` },
        { status: 422 },
      )
    }
    if (!isValidPublicIp(ip)) {
      return NextResponse.json(
        { error: "Domain resolves to a private or reserved IP address" },
        { status: 422 },
      )
    }
  } else {
    return NextResponse.json(
      { error: "Enter a valid public IP address or domain name" },
      { status: 422 },
    )
  }

  try {
    const redis = await getRedisClient()
    const cacheKey = buildCacheKey(ip)
    const cached = await redis.get(cacheKey)

    if (cached) {
      const cachedResult = JSON.parse(cached) as IpLookupResult
      return NextResponse.json(
        resolvedFrom ? { ...cachedResult, resolvedFrom } : cachedResult,
      )
    }

    const result = await fetchIpInfo(ip)
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result))

    return NextResponse.json(resolvedFrom ? { ...result, resolvedFrom } : result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed"
    console.error("IP lookup error:", { query, ip, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
