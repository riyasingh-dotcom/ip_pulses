"use client"

import { useState } from "react"
import type { IpLookupResult, LookupApiResponse } from "@/types/ip"
import { isValidPublicIp, normalizeIp } from "@/lib/validate"
import { ResultSection, type ResultField } from "./ResultSection"

function buildLocationFields(result: IpLookupResult): ResultField[] {
  return [
    { label: "IP Address", value: result.ip, valueTestId: "result-ip", copyTestId: "copy-ip" },
    result.hostname ? { label: "Hostname", value: result.hostname } : null,
    result.city ? { label: "City", value: result.city } : null,
    result.region ? { label: "Region", value: result.region } : null,
    result.country ? { label: "Country", value: result.country } : null,
    result.postal ? { label: "Postal Code", value: result.postal } : null,
    result.timezone ? { label: "Timezone", value: result.timezone } : null,
    result.loc ? { label: "Coordinates", value: result.loc } : null,
  ].filter((f): f is ResultField => f !== null)
}

function buildNetworkFields(result: IpLookupResult): ResultField[] {
  return [
    result.org ? { label: "Organization", value: result.org } : null,
    result.asn?.asn ? { label: "ASN", value: result.asn.asn } : null,
    result.asn?.name ? { label: "ASN Name", value: result.asn.name } : null,
    result.asn?.domain ? { label: "ASN Domain", value: result.asn.domain } : null,
    result.asn?.route ? { label: "Route", value: result.asn.route } : null,
    result.asn?.type ? { label: "Network Type", value: result.asn.type } : null,
  ].filter((f): f is ResultField => f !== null)
}

function buildCompanyFields(result: IpLookupResult): ResultField[] {
  if (!result.company) return []
  return [
    result.company.name ? { label: "Company", value: result.company.name } : null,
    result.company.domain ? { label: "Domain", value: result.company.domain } : null,
    result.company.type ? { label: "Type", value: result.company.type } : null,
  ].filter((f): f is ResultField => f !== null)
}

function buildPrivacyFields(result: IpLookupResult): ResultField[] {
  if (!result.privacy) return []
  return [
    { label: "VPN", value: result.privacy.vpn ? "Yes" : "No" },
    { label: "Proxy", value: result.privacy.proxy ? "Yes" : "No" },
    { label: "Tor", value: result.privacy.tor ? "Yes" : "No" },
    { label: "Relay", value: result.privacy.relay ? "Yes" : "No" },
    { label: "Hosting", value: result.privacy.hosting ? "Yes" : "No" },
    result.privacy.service
      ? { label: "Service", value: result.privacy.service }
      : null,
  ].filter((f): f is ResultField => f !== null)
}

function buildAbuseFields(result: IpLookupResult): ResultField[] {
  if (!result.abuse) return []
  return [
    result.abuse.name ? { label: "Contact Name", value: result.abuse.name } : null,
    result.abuse.email ? { label: "Email", value: result.abuse.email } : null,
    result.abuse.phone ? { label: "Phone", value: result.abuse.phone } : null,
    result.abuse.address ? { label: "Address", value: result.abuse.address } : null,
    result.abuse.network ? { label: "Network", value: result.abuse.network } : null,
    result.abuse.country ? { label: "Country", value: result.abuse.country } : null,
  ].filter((f): f is ResultField => f !== null)
}

export function LookupPage(): React.JSX.Element {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IpLookupResult | null>(null)

  async function handleLookup(): Promise<void> {
    if (loading) return

    const ip = normalizeIp(input)

    if (!ip) {
      setError("Please enter an IP address")
      return
    }

    if (!isValidPublicIp(ip)) {
      setError("Invalid or private IP address. Enter a public IPv4 or IPv6 address.")
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch(`/api/lookup?ip=${encodeURIComponent(ip)}`)
      const data: LookupApiResponse = (await res.json()) as LookupApiResponse

      if ("error" in data) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch {
      setError("Failed to connect to the lookup service. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      void handleLookup()
    }
  }

  const locationFields = result ? buildLocationFields(result) : []
  const networkFields = result ? buildNetworkFields(result) : []
  const companyFields = result ? buildCompanyFields(result) : []
  const privacyFields = result ? buildPrivacyFields(result) : []
  const abuseFields = result ? buildAbuseFields(result) : []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            IP Pulse
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Geolocation · ASN · Threat intelligence · Whois
          </p>
        </header>

        <div className="flex gap-2">
          <input
            data-testid="ip-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a public IP address (e.g. 8.8.8.8)"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="IP address"
          />
          <button
            data-testid="lookup-button"
            onClick={() => void handleLookup()}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Looking up…" : "Lookup"}
          </button>
        </div>

        {error && (
          <div
            data-testid="error-message"
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {result && (
          <div data-testid="results-section" className="mt-8 space-y-4">
            {locationFields.length > 0 && (
              <ResultSection title="Location" fields={locationFields} />
            )}
            {networkFields.length > 0 && (
              <ResultSection title="Network / ASN" fields={networkFields} />
            )}
            {companyFields.length > 0 && (
              <ResultSection title="Company" fields={companyFields} />
            )}
            {privacyFields.length > 0 && (
              <ResultSection title="Privacy & Threat" fields={privacyFields} />
            )}
            {abuseFields.length > 0 && (
              <ResultSection title="Abuse Contact" fields={abuseFields} />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
