import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(),
  buildCacheKey: (ip: string) => `ip:lookup:${ip}`,
  CACHE_TTL: 86400,
}))

vi.mock("@/lib/ipinfo", () => ({
  fetchIpInfo: vi.fn(),
}))

vi.mock("@/lib/dns", () => ({
  resolveDomain: vi.fn(),
}))

vi.mock("@/lib/history", () => ({
  logLookup: vi.fn().mockResolvedValue(undefined),
}))

import { GET } from "./route"
import { getRedisClient } from "@/lib/redis"
import { fetchIpInfo } from "@/lib/ipinfo"
import { resolveDomain } from "@/lib/dns"

const mockGet = vi.fn<(key: string) => Promise<string | null>>()
const mockSetEx = vi.fn<(key: string, ttl: number, value: string) => Promise<number>>()
const mockRedis = { get: mockGet, setEx: mockSetEx }

describe("GET /api/lookup", () => {
  beforeEach(() => {
    // Type assertion required: mock object doesn't implement the full RedisClient interface
    vi.mocked(getRedisClient).mockResolvedValue(
      mockRedis as unknown as Awaited<ReturnType<typeof getRedisClient>>,
    )
    mockGet.mockResolvedValue(null)
    mockSetEx.mockResolvedValue(1)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("input validation", () => {
    it("returns 400 when ip param is missing", async () => {
      const req = new NextRequest("http://localhost/api/lookup")
      const res = await GET(req)
      expect(res.status).toBe(400)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ error: expect.any(String) })
    })

    it("returns 422 for a private IP (192.168.x.x)", async () => {
      const req = new NextRequest("http://localhost/api/lookup?ip=192.168.1.1")
      const res = await GET(req)
      expect(res.status).toBe(422)
    })

    it("returns 422 for loopback address", async () => {
      const req = new NextRequest("http://localhost/api/lookup?ip=127.0.0.1")
      const res = await GET(req)
      expect(res.status).toBe(422)
    })

    it("returns 422 for a plain non-IP, non-domain string", async () => {
      const req = new NextRequest("http://localhost/api/lookup?ip=not-valid")
      const res = await GET(req)
      expect(res.status).toBe(422)
    })
  })

  describe("domain resolution", () => {
    it("resolves a domain to its IP and returns results with resolvedFrom", async () => {
      vi.mocked(resolveDomain).mockResolvedValue("8.8.8.8")
      const ipResult = { ip: "8.8.8.8", city: "Mountain View", country: "US" }
      vi.mocked(fetchIpInfo).mockResolvedValue(ipResult)

      const req = new NextRequest("http://localhost/api/lookup?ip=google.com")
      const res = await GET(req)

      expect(res.status).toBe(200)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ ip: "8.8.8.8", resolvedFrom: "google.com" })
    })

    it("returns 422 when domain DNS resolution fails", async () => {
      vi.mocked(resolveDomain).mockRejectedValue(new Error("ENOTFOUND"))

      const req = new NextRequest("http://localhost/api/lookup?ip=nonexistent.invalid")
      const res = await GET(req)

      expect(res.status).toBe(422)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ error: expect.stringContaining("Could not resolve") })
    })

    it("returns 422 when domain resolves to a private IP", async () => {
      vi.mocked(resolveDomain).mockResolvedValue("10.0.0.1")

      const req = new NextRequest("http://localhost/api/lookup?ip=internal.example.com")
      const res = await GET(req)

      expect(res.status).toBe(422)
    })

    it("injects resolvedFrom into a cached result", async () => {
      vi.mocked(resolveDomain).mockResolvedValue("8.8.8.8")
      mockGet.mockResolvedValue(JSON.stringify({ ip: "8.8.8.8", city: "Mountain View" }))

      const req = new NextRequest("http://localhost/api/lookup?ip=dns.google")
      const res = await GET(req)

      expect(res.status).toBe(200)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ ip: "8.8.8.8", resolvedFrom: "dns.google" })
      expect(fetchIpInfo).not.toHaveBeenCalled()
    })
  })

  describe("cache behaviour", () => {
    it("returns cached result and skips fetchIpInfo", async () => {
      mockGet.mockResolvedValue(JSON.stringify({ ip: "8.8.8.8", city: "Mountain View" }))

      const req = new NextRequest("http://localhost/api/lookup?ip=8.8.8.8")
      const res = await GET(req)

      expect(res.status).toBe(200)
      expect(fetchIpInfo).not.toHaveBeenCalled()
    })

    it("fetches from ipinfo and writes to cache on a miss", async () => {
      const ipResult = { ip: "8.8.8.8", city: "Mountain View", country: "US" }
      vi.mocked(fetchIpInfo).mockResolvedValue(ipResult)

      const req = new NextRequest("http://localhost/api/lookup?ip=8.8.8.8")
      const res = await GET(req)

      expect(res.status).toBe(200)
      expect(fetchIpInfo).toHaveBeenCalledWith("8.8.8.8")
      expect(mockSetEx).toHaveBeenCalledWith("ip:lookup:8.8.8.8", 86400, JSON.stringify(ipResult))
    })
  })

  describe("error handling", () => {
    it("returns 500 when fetchIpInfo throws", async () => {
      vi.mocked(fetchIpInfo).mockRejectedValue(new Error("Network timeout"))

      const req = new NextRequest("http://localhost/api/lookup?ip=8.8.8.8")
      const res = await GET(req)

      expect(res.status).toBe(500)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ error: "Network timeout" })
    })

    it("returns 500 with generic message for non-Error throws", async () => {
      vi.mocked(fetchIpInfo).mockRejectedValue("unexpected string error")

      const req = new NextRequest("http://localhost/api/lookup?ip=8.8.8.8")
      const res = await GET(req)

      expect(res.status).toBe(500)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ error: "Lookup failed" })
    })
  })
})
