import { CopyField } from "./CopyField"

export type ResultField = {
  label: string
  value: string
  valueTestId?: string
  copyTestId?: string
}

const accentBorder = {
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  emerald: "border-l-emerald-500",
  rose: "border-l-rose-500",
  amber: "border-l-amber-400",
} as const satisfies Record<string, string>

type Accent = keyof typeof accentBorder

type ResultSectionProps = {
  title: string
  fields: ResultField[]
  icon: string
  accent: Accent
}

export function ResultSection({
  title,
  fields,
  icon,
  accent,
}: ResultSectionProps): React.JSX.Element {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm border-l-4 ${accentBorder[accent]}`}
    >
      <h2 className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <span role="img" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      <dl className="divide-y divide-gray-100">
        {fields.map((field) => (
          <CopyField
            key={field.label}
            label={field.label}
            value={field.value}
            valueTestId={field.valueTestId}
            copyTestId={field.copyTestId}
          />
        ))}
      </dl>
    </div>
  )
}
