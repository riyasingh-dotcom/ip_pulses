import { promises as dns } from "dns"

export async function resolveDomain(domain: string): Promise<string> {
  const result = await dns.lookup(domain, { family: 4 })
  return result.address
}
