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

import { GET } from "./route"
import { getRedisClient } from "@/lib/redis"
import { fetchIpInfo } from "@/lib/ipinfo"

const mockGet = vi.fn<[string], Promise<string | null>>()
const mockSetEx = vi.fn<[string, number, string], Promise<number>>()

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
    vi.restoreAllMocks()
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
      const json: unknown = await res.json()
      expect(json).toMatchObject({ error: "Invalid or private IP address" })
    })

    it("returns 422 for loopback address", async () => {
      const req = new NextRequest("http://localhost/api/lookup?ip=127.0.0.1")
      const res = await GET(req)
      expect(res.status).toBe(422)
    })

    it("returns 422 for a non-IP string", async () => {
      const req = new NextRequest("http://localhost/api/lookup?ip=not-an-ip")
      const res = await GET(req)
      expect(res.status).toBe(422)
    })
  })

  describe("cache behaviour", () => {
    it("returns cached result and skips fetchIpInfo", async () => {
      const cached = { ip: "8.8.8.8", city: "Mountain View", country: "US" }
      mockGet.mockResolvedValue(JSON.stringify(cached))

      const req = new NextRequest("http://localhost/api/lookup?ip=8.8.8.8")
      const res = await GET(req)

      expect(res.status).toBe(200)
      const json: unknown = await res.json()
      expect(json).toMatchObject({ ip: "8.8.8.8" })
      expect(fetchIpInfo).not.toHaveBeenCalled()
    })

    it("fetches from ipinfo and writes to cache on a miss", async () => {
      const ipResult = { ip: "8.8.8.8", city: "Mountain View", country: "US" }
      vi.mocked(fetchIpInfo).mockResolvedValue(ipResult)

      const req = new NextRequest("http://localhost/api/lookup?ip=8.8.8.8")
      const res = await GET(req)

      expect(res.status).toBe(200)
      expect(fetchIpInfo).toHaveBeenCalledWith("8.8.8.8")
      expect(mockSetEx).toHaveBeenCalledWith(
        "ip:lookup:8.8.8.8",
        86400,
        JSON.stringify(ipResult),
      )
    })

    it("normalizes IP before cache key lookup (trims + lowercases)", async () => {
      const ipResult = { ip: "8.8.8.8" }
      vi.mocked(fetchIpInfo).mockResolvedValue(ipResult)

      const req = new NextRequest("http://localhost/api/lookup?ip=%20%208.8.8.8%20%20")
      await GET(req)

      expect(mockGet).toHaveBeenCalledWith("ip:lookup:8.8.8.8")
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
