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
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {label}
        </dt>
        <dd
          data-testid={valueTestId}
          className="mt-0.5 truncate font-mono text-sm text-gray-900"
        >
          {value}
        </dd>
      </div>
      <button
        data-testid={copyTestId}
        onClick={handleCopy}
        className="ml-4 min-w-[52px] rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  )
}
