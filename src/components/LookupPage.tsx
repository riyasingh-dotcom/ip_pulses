"use client"

import { useState } from "react"
import type { IpLookupResult, LookupApiResponse } from "@/types/ip"
import { isValidPublicIp, isValidDomain, normalizeIp } from "@/lib/validate"
import { ResultSection, type ResultField } from "./ResultSection"
import { RecentLookups } from "./RecentLookups"

function compact(fields: (ResultField | null)[]): ResultField[] {
  return fields.filter((f): f is ResultField => f !== null)
}

function buildLocationFields(result: IpLookupResult): ResultField[] {
  return compact([
    result.resolvedFrom
      ? {
          label: "Queried Domain",
          value: result.resolvedFrom,
          valueTestId: "result-domain",
          copyTestId: "copy-domain",
        }
      : null,
    { label: "IP Address", value: result.ip, valueTestId: "result-ip", copyTestId: "copy-ip" },
    result.hostname ? { label: "Hostname", value: result.hostname } : null,
    result.city ? { label: "City", value: result.city } : null,
    result.region ? { label: "Region", value: result.region } : null,
    result.country ? { label: "Country", value: result.country } : null,
    result.postal ? { label: "Postal Code", value: result.postal } : null,
    result.timezone ? { label: "Timezone", value: result.timezone } : null,
    result.loc ? { label: "Coordinates", value: result.loc } : null,
  ])
}

function buildNetworkFields(result: IpLookupResult): ResultField[] {
  return compact([
    result.org ? { label: "Organization", value: result.org } : null,
    result.asn?.asn ? { label: "ASN", value: result.asn.asn } : null,
    result.asn?.name ? { label: "ASN Name", value: result.asn.name } : null,
    result.asn?.domain ? { label: "ASN Domain", value: result.asn.domain } : null,
    result.asn?.route ? { label: "Route", value: result.asn.route } : null,
    result.asn?.type ? { label: "Network Type", value: result.asn.type } : null,
  ])
}

function buildCompanyFields(result: IpLookupResult): ResultField[] {
  if (!result.company) return []
  return compact([
    result.company.name ? { label: "Company", value: result.company.name } : null,
    result.company.domain ? { label: "Domain", value: result.company.domain } : null,
    result.company.type ? { label: "Type", value: result.company.type } : null,
  ])
}

function buildPrivacyFields(result: IpLookupResult): ResultField[] {
  if (!result.privacy) return []
  return compact([
    { label: "VPN", value: result.privacy.vpn ? "Yes" : "No" },
    { label: "Proxy", value: result.privacy.proxy ? "Yes" : "No" },
    { label: "Tor", value: result.privacy.tor ? "Yes" : "No" },
    { label: "Relay", value: result.privacy.relay ? "Yes" : "No" },
    { label: "Hosting", value: result.privacy.hosting ? "Yes" : "No" },
    result.privacy.service ? { label: "Service", value: result.privacy.service } : null,
  ])
}

function buildAbuseFields(result: IpLookupResult): ResultField[] {
  if (!result.abuse) return []
  return compact([
    result.abuse.name ? { label: "Contact Name", value: result.abuse.name } : null,
    result.abuse.email ? { label: "Email", value: result.abuse.email } : null,
    result.abuse.phone ? { label: "Phone", value: result.abuse.phone } : null,
    result.abuse.address ? { label: "Address", value: result.abuse.address } : null,
    result.abuse.network ? { label: "Network", value: result.abuse.network } : null,
    result.abuse.country ? { label: "Country", value: result.abuse.country } : null,
  ])
}

export function LookupPage(): React.JSX.Element {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IpLookupResult | null>(null)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  async function handleLookup(queryOverride?: string): Promise<void> {
    if (loading) return

    const q = normalizeIp(queryOverride ?? input)

    if (!q) {
      setError("Please enter an IP address or domain name")
      return
    }

    if (!isValidPublicIp(q) && !isValidDomain(q)) {
      setError("Enter a valid public IP address (e.g. 8.8.8.8) or domain name (e.g. google.com)")
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch(`/api/lookup?ip=${encodeURIComponent(q)}`)
      const data = (await res.json()) as LookupApiResponse

      if ("error" in data) {
        setError(data.error)
      } else {
        setResult(data)
        setHistoryRefresh((c) => c + 1)
      }
    } catch {
      setError("Failed to connect to the lookup service. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") void handleLookup()
  }

  function handleSelectHistory(query: string): void {
    setInput(query)
    void handleLookup(query)
  }

  const locationFields = result ? buildLocationFields(result) : []
  const networkFields = result ? buildNetworkFields(result) : []
  const companyFields = result ? buildCompanyFields(result) : []
  const privacyFields = result ? buildPrivacyFields(result) : []
  const abuseFields = result ? buildAbuseFields(result) : []

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <span>⚡</span> Free IP & Domain Intelligence
          </div>
          <h1 className="mt-1 text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              IP Pulse
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Geolocation · ASN · Threat intelligence · Whois
          </p>
        </header>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </div>
            <input
              data-testid="ip-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter IP or domain — e.g. 8.8.8.8 or google.com"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 font-mono text-sm shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              aria-label="IP address or domain name"
            />
          </div>
          <button
            data-testid="lookup-button"
            onClick={() => void handleLookup()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Looking up…
              </>
            ) : (
              "Lookup"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            data-testid="error-message"
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span className="mt-px text-base leading-none">⚠️</span>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div data-testid="results-section" className="mt-6 space-y-3">
            {locationFields.length > 0 && (
              <ResultSection title="Location" fields={locationFields} icon="📍" accent="blue" />
            )}
            {networkFields.length > 0 && (
              <ResultSection title="Network / ASN" fields={networkFields} icon="🌐" accent="purple" />
            )}
            {companyFields.length > 0 && (
              <ResultSection title="Company" fields={companyFields} icon="🏢" accent="emerald" />
            )}
            {privacyFields.length > 0 && (
              <ResultSection title="Privacy & Threat" fields={privacyFields} icon="🔒" accent="rose" />
            )}
            {abuseFields.length > 0 && (
              <ResultSection title="Abuse Contact" fields={abuseFields} icon="⚠️" accent="amber" />
            )}
          </div>
        )}

        {/* Recent Lookups */}
        <RecentLookups onSelect={handleSelectHistory} refreshTrigger={historyRefresh} />
      </div>
    </main>
  )
}
