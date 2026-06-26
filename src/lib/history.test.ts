import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("./db", () => ({
  getDb: vi.fn(),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}))

import { logLookup, getRecentLookups } from "./history"
import { getDb, ensureSchema } from "./db"

const mockQuery = vi.fn()

describe("logLookup", () => {
  beforeEach(() => {
    // Type assertion required: mock doesn't implement full Pool interface
    vi.mocked(getDb).mockReturnValue(
      { query: mockQuery } as unknown as ReturnType<typeof getDb>,
    )
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 })
    vi.mocked(ensureSchema).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("calls ensureSchema then inserts a row with all fields", async () => {
    await logLookup({
      query: "google.com",
      resolved_ip: "8.8.8.8",
      country: "US",
      city: "Mountain View",
      org: "AS15169 Google LLC",
    })

    expect(ensureSchema).toHaveBeenCalled()
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO lookups"),
      ["google.com", "8.8.8.8", "US", "Mountain View", "AS15169 Google LLC"],
    )
  })

  it("handles null location fields without throwing", async () => {
    await logLookup({
      query: "8.8.8.8",
      resolved_ip: "8.8.8.8",
      country: null,
      city: null,
      org: null,
    })

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO lookups"),
      ["8.8.8.8", "8.8.8.8", null, null, null],
    )
  })
})

describe("getRecentLookups", () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReturnValue(
      { query: mockQuery } as unknown as ReturnType<typeof getDb>,
    )
    vi.mocked(ensureSchema).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns rows from the database", async () => {
    const rows = [
      {
        id: 1,
        query: "8.8.8.8",
        resolved_ip: "8.8.8.8",
        country: "US",
        city: "Mountain View",
        org: null,
        looked_up_at: "2024-01-01T00:00:00Z",
      },
    ]
    mockQuery.mockResolvedValue({ rows })

    const result = await getRecentLookups()
    expect(result).toEqual(rows)
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [10])
  })

  it("accepts a custom limit", async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    await getRecentLookups(5)
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [5])
  })

  it("calls ensureSchema before querying", async () => {
    mockQuery.mockResolvedValue({ rows: [] })
    await getRecentLookups()
    expect(ensureSchema).toHaveBeenCalled()
  })
})
