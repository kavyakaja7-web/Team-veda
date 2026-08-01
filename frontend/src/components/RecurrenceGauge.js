import React, { useId } from 'react'

export default function RecurrenceGauge({ probability = 0.85, confidence = 0.942, size = 260 }) {
  const gradientId = useId()
  // Ensure probability is between 0 and 1
  const prob = Math.min(Math.max(Number(probability) || 0, 0), 1)
  const percentage = (prob * 100).toFixed(1)

  // Arc math for semicircle gauge
  // Semicircle angle from -180 deg to 0 deg
  const strokeWidth = 22
  const center = size / 2
  const radius = center - strokeWidth - 10
  const arcLength = Math.PI * radius
  const filledArc = arcLength * prob
  const dashArray = `${filledArc} ${arcLength}`

  // Angle for pointer needle (-180 to 0 degrees)
  const needleAngle = -180 + prob * 180

  // Color determination
  let riskTier = 'LOW'
  let riskColorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200'
  let riskGlowColor = '#10B981'

  if (prob >= 0.7) {
    riskTier = 'CRITICAL RECURRENCE RISK'
    riskColorClass = 'text-red-600 bg-red-50 border-red-200 animate-pulse'
    riskGlowColor = '#EF4444'
  } else if (prob >= 0.4) {
    riskTier = 'MODERATE RECURRENCE RISK'
    riskColorClass = 'text-amber-600 bg-amber-50 border-amber-200'
    riskGlowColor = '#F59E0B'
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* SVG Semicircle Gauge */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 30 }}>
        <svg
          width={size}
          height={size / 2 + 25}
          viewBox={`0 0 ${size} ${size / 2 + 25}`}
          className="overflow-visible"
        >
          <defs>
            {/* Gradient definition from Emerald to Amber to Crimson */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground Dynamic Arc */}
          <path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
            filter={`url(#glow-${gradientId})`}
          />

          {/* Gauge Tick Markers */}
          {[-180, -135, -90, -45, 0].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const innerR = radius - strokeWidth / 2 - 8
            const outerR = radius - strokeWidth / 2 - 2
            const x1 = center + innerR * Math.cos(rad)
            const y1 = center + innerR * Math.sin(rad)
            const x2 = center + outerR * Math.cos(rad)
            const y2 = center + outerR * Math.sin(rad)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94A3B8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}

          {/* Center Hub & Pointer Needle */}
          <g style={{ transform: `translate(${center}px, ${center}px)` }}>
            {/* Pointer Line */}
            <line
              x1="0"
              y1="0"
              x2={radius - 28}
              y2="0"
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: '0 0',
                transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
            {/* Center Pivot Circle */}
            <circle r="9" fill="#0F172A" />
            <circle r="4" fill={riskGlowColor} />
          </g>
        </svg>

        {/* Floating Percentage Indicator */}
        <div
          className="absolute text-center flex flex-col items-center"
          style={{ bottom: 0 }}
        >
          <span className="stat-figure text-4xl font-extrabold text-slate-900 tracking-tight">
            {percentage}<span className="text-2xl text-slate-500 font-semibold">%</span>
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-0.5">
            Recurrence Index
          </span>
        </div>
      </div>

      {/* Risk Badge and Confidence */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider border shadow-sm ${riskColorClass}`}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: riskGlowColor }}
          />
          {riskTier}
        </span>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
          <span>
            Model Confidence:{' '}
            <strong className="text-slate-800 font-mono">
              {(confidence * 100).toFixed(1)}%
            </strong>
          </span>
          <span>•</span>
          <span>
            Window:{' '}
            <strong className="text-slate-800 font-mono">24–48 Hours</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
