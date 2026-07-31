const RISK_OPTIONS = [
  { value: '', label: 'All risk levels' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function Filters({ value, onChange }) {
  const { search = '', risk = '', ward = '' } = value || {}

  function update(patch) {
    onChange?.({ search, risk, ward, ...patch })
  }

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        value={search}
        onChange={(e) => update({ search: e.target.value })}
        placeholder="Search by GVP ID or address…"
        className="input-field sm:max-w-xs"
      />
      <select
        value={risk}
        onChange={(e) => update({ risk: e.target.value })}
        className="input-field sm:max-w-[160px]"
      >
        {RISK_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={ward}
        onChange={(e) => update({ ward: e.target.value })}
        placeholder="Ward"
        className="input-field sm:max-w-[160px]"
      />
    </div>
  )
}
