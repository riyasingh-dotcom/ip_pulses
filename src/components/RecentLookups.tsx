"use client"

import { useEffect, useState } from "react"
import type { LookupHistoryItem } from "@/types/ip"

function countryFlag(code: string): string {
  return Array.from(code.toUpperCase())
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("")
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

type RecentLookupsProps = {
  onSelect: (query: string) => void
  refreshTrigger: number
}

export function RecentLookups({
  onSelect,
  refreshTrigger,
}: RecentLookupsProps): React.JSX.Element | null {
  const [items, setItems] = useState<LookupHistoryItem[]>([])

  useEffect(() => {
    void fetch("/api/history")
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setItems(data as LookupHistoryItem[])
        }
      })
      .catch(() => {})
  }, [refreshTrigger])

  if (items.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Recent Lookups
      </h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.query)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50 ${
              idx !== 0 ? "border-t border-gray-100" : ""
            }`}
          >
            <span className="text-xl leading-none" role="img" aria-label={item.country ?? "globe"}>
              {item.country ? countryFlag(item.country) : "🌐"}
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate font-mono text-sm font-medium text-gray-900">
                {item.query}
              </span>
              <span className="block truncate text-xs text-gray-400">
                {[item.city, item.country].filter(Boolean).join(", ")}
                {item.resolved_ip !== item.query ? ` · ${item.resolved_ip}` : ""}
              </span>
            </div>
            <span className="shrink-0 text-xs text-gray-400">{timeAgo(item.looked_up_at)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
