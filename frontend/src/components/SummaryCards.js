const CARD_CONFIG = [
  { key: 'total', label: 'Total GVPs', accent: 'text-ink', bg: 'bg-panel' },
  { key: 'high', label: 'High risk', accent: 'text-risk-high', bg: 'bg-risk-highBg' },
  { key: 'medium', label: 'Medium risk', accent: 'text-risk-medium', bg: 'bg-risk-mediumBg' },
  { key: 'low', label: 'Low risk', accent: 'text-risk-low', bg: 'bg-risk-lowBg' },
]

function tally(gvps = []) {
  return gvps.reduce(
    (acc, gvp) => {
      const level = String(gvp.risk_level || gvp.riskLevel || gvp.risk || 'low').toLowerCase()
      if (level in acc) acc[level] += 1
      acc.total += 1
      return acc
    },
    { total: 0, high: 0, medium: 0, low: 0 },
  )
}

export default function SummaryCards({ gvps = [] }) {
  const counts = tally(gvps)

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {CARD_CONFIG.map(({ key, label, accent, bg }) => (
        <div key={key} className={`card ${bg}`}>
          <p className="eyebrow">{label}</p>
          <p className={`stat-figure mt-2 text-3xl font-semibold ${accent}`}>
            {counts[key]}
          </p>
        </div>
      ))}
    </div>
  )
}
