const STYLES = {
  high: { bg: 'bg-risk-highBg', text: 'text-risk-high', dot: 'bg-risk-high', label: 'High risk' },
  medium: { bg: 'bg-risk-mediumBg', text: 'text-risk-medium', dot: 'bg-risk-medium', label: 'Medium risk' },
  low: { bg: 'bg-risk-lowBg', text: 'text-risk-low', dot: 'bg-risk-low', label: 'Low risk' },
}

export default function RiskBadge({ level = 'low', compact = false }) {
  const key = String(level).toLowerCase()
  const style = STYLES[key] || STYLES.low

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {key === 'high' && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${style.dot} animate-pulseRing`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {!compact && style.label}
    </span>
  )
}
