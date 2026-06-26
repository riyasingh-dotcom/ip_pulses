"use client"

import { useState } from "react"

type CopyFieldProps = {
  label: string
  value: string
  valueTestId?: string
  copyTestId?: string
}

export function CopyField({
  label,
  value,
  valueTestId,
  copyTestId,
}: CopyFieldProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  function handleCopy(): void {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/60">
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </dt>
        <dd
          data-testid={valueTestId}
          className="mt-0.5 truncate font-mono text-sm text-gray-800"
        >
          {value}
        </dd>
      </div>
      <button
        data-testid={copyTestId}
        onClick={handleCopy}
        className={`ml-4 min-w-[58px] rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
          copied
            ? "bg-emerald-50 text-emerald-700"
            : "text-gray-400 hover:bg-blue-50 hover:text-blue-700 group-hover:text-gray-500"
        }`}
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  )
}
