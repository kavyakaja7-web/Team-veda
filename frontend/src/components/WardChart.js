import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

function tallyByWard(gvps) {
  const counts = {}
  gvps.forEach((g) => {
    const ward = g.ward || 'Ward 2'
    counts[ward] = (counts[ward] || 0) + 1
  })
  return Object.entries(counts)
    .map(([ward, count]) => ({ ward, count }))
    .sort((a, b) => b.count - a.count)
}

export default function WardChart({ gvps = [] }) {
  const data = tallyByWard(gvps)

  return (
    <div className="card-cmd bg-white border border-slate-200 shadow-card rounded-2xl p-5 h-full flex flex-col justify-between">
      <div>
        <span className="eyebrow flex items-center gap-1.5">
          <BarChart3 size={14} className="text-emerald-600" /> Ward Density Analysis
        </span>
        <h3 className="font-display font-bold text-slate-900 mt-0.5">
          GVP Blackspots per Ward
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="ward"
            width={85}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                    <p className="font-bold text-slate-900">{item.ward}</p>
                    <p className="text-emerald-600 font-semibold mt-0.5">{item.count} Active Blackspots</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" fill="#059669" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
