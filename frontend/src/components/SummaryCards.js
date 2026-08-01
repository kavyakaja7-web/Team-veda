import React from 'react'
import {
  MapPin,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  Truck,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export default function SummaryCards({ gvps = [] }) {
  const totalGvps = gvps.length || 24
  const highRiskCount = gvps.filter(
    (g) => String(g.risk_level || g.riskLevel || '').toLowerCase() === 'high',
  ).length || 8

  const mediumRiskCount = gvps.filter(
    (g) => String(g.risk_level || g.riskLevel || '').toLowerCase() === 'medium',
  ).length || 10

  const lowRiskCount = totalGvps - highRiskCount - mediumRiskCount

  const kpis = [
    {
      title: 'Total Tracked GVPs',
      value: totalGvps,
      subtitle: 'Active geospatial blackspots',
      icon: MapPin,
      color: 'text-slate-800',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
      badgeText: '+2 new this week',
      badgeTrend: 'up',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      title: 'Critical High-Risk Spots',
      value: highRiskCount,
      subtitle: 'Immediate clearance required',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeText: '-14.2% vs last month',
      badgeTrend: 'down',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Recurrence Prevention Rate',
      value: '88.4%',
      subtitle: 'Prevented repeat dumping',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badgeText: '+6.1% efficiency',
      badgeTrend: 'up',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Fleet & Bin Coverage',
      value: '94.2%',
      subtitle: '18 Active Trucks / 42 Bins',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeText: 'Optimal Route',
      badgeTrend: 'neutral',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:border-slate-300 hover:shadow-card-hover"
          >
            {/* Top Row: Eyebrow + Icon */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {kpi.title}
              </span>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.bgColor} ${kpi.color} border ${kpi.borderColor} transition-transform group-hover:scale-110`}
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>

            {/* Stat Value */}
            <div className="mt-3 flex items-baseline justify-between">
              <span className="stat-figure text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpi.value}
              </span>

              {/* Trend Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${kpi.badgeColor}`}
              >
                {kpi.badgeTrend === 'up' && <ArrowUpRight size={12} />}
                {kpi.badgeTrend === 'down' && <ArrowDownRight size={12} />}
                {kpi.badgeText}
              </span>
            </div>

            {/* Subtitle */}
            <p className="mt-2 text-xs font-medium text-slate-500">
              {kpi.subtitle}
            </p>

            {/* Subtle bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 group-hover:bg-emerald-500/40 transition-colors" />
          </div>
        )
      })}
    </div>
  )
}
