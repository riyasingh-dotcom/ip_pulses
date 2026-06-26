import { CopyField } from "./CopyField"

export type ResultField = {
  label: string
  value: string
  valueTestId?: string
  copyTestId?: string
}

type ResultSectionProps = {
  title: string
  fields: ResultField[]
}

export function ResultSection({ title, fields }: ResultSectionProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <h2 className="border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
