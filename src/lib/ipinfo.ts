import { z } from "zod"
import type { IpLookupResult } from "@/types/ip"

const IpInfoSchema = z.object({
  ip: z.string(),
  hostname: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  loc: z.string().optional(),
  org: z.string().optional(),
  postal: z.string().optional(),
  timezone: z.string().optional(),
  asn: z
    .object({
      asn: z.string(),
      name: z.string(),
      domain: z.string(),
      route: z.string(),
      type: z.string(),
    })
    .optional(),
  company: z
    .object({
      name: z.string(),
      domain: z.string(),
      type: z.string(),
    })
    .optional(),
  abuse: z
    .object({
      address: z.string(),
      country: z.string(),
      email: z.string(),
      name: z.string(),
      network: z.string(),
      phone: z.string(),
    })
    .optional(),
  privacy: z
    .object({
      vpn: z.boolean(),
      proxy: z.boolean(),
      tor: z.boolean(),
      relay: z.boolean(),
      hosting: z.boolean(),
      service: z.string(),
    })
    .optional(),
})

export async function fetchIpInfo(ip: string): Promise<IpLookupResult> {
  const token = process.env.IPINFO_TOKEN
  if (!token) {
    throw new Error("IPINFO_TOKEN is not configured")
  }

  const res = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`ipinfo.io responded with ${res.status} ${res.statusText}`)
  }

  const raw: unknown = await res.json()
  const parsed = IpInfoSchema.safeParse(raw)

  if (!parsed.success) {
    throw new Error(`Unexpected ipinfo.io response: ${parsed.error.message}`)
  }

  return parsed.data
}
