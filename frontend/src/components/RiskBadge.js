import React from 'react'

const STYLES = {
  high: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'High Risk',
  },
  medium: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Medium Risk',
  },
  low: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Low Risk',
  },
}

export default function RiskBadge({ level = 'low', compact = false }) {
  const key = String(level).toLowerCase()
  const style = STYLES[key] || STYLES.low

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide uppercase shadow-sm ${style.bg} ${style.text}`}
    >
      <span className="relative flex h-2 w-2">
        {key === 'high' && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`} />
      </span>
      {!compact && style.label}
    </span>
  )
}
