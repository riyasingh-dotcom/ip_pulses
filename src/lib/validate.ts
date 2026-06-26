import { z } from "zod"

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
]

const PRIVATE_IPV6_PATTERNS = [
  /^::1$/,
  /^fc/i,
  /^fd/i,
  /^fe80/i,
  /^ff/i,
]

function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(ip))
}

function isPrivateIPv6(ip: string): boolean {
  return PRIVATE_IPV6_PATTERNS.some((pattern) => pattern.test(ip.toLowerCase()))
}

export function isValidPublicIp(ip: string): boolean {
  const ipv4Result = z.string().ip({ version: "v4" }).safeParse(ip)
  if (ipv4Result.success) {
    return !isPrivateIPv4(ip)
  }

  const ipv6Result = z.string().ip({ version: "v6" }).safeParse(ip)
  if (ipv6Result.success) {
    return !isPrivateIPv6(ip)
  }

  return false
}

export function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase()
}
