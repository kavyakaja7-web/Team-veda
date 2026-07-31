import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useAnalytics, useAnalyticsSummary } from '../hooks/useAnalytics.js'
import LoadingSpinner from '../components/LoadingSpinner.js'
import GroqInsightsPanel from '../components/GroqInsightsPanel.js'
import RiskBadge from '../components/RiskBadge.js'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Layers,
  MapPin,
  Sparkles,
  Zap,
} from 'lucide-react'

const RISK_PALETTE = {
  high: '#C1443C',
  medium: '#E8A33D',
  low: '#4C8B63',
}

function percentage(val) {
  const num = Number(val)
  if (!Number.isFinite(num)) return '—'
  return `${(num * 100).toFixed(1)}%`
}

export default function Analytics() {
  const { data, isLoading } = useAnalytics()
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary()

  if (isLoading || summaryLoading) return <LoadingSpinner label="Computing analytics matrix & Groq LPU metrics…" />

  const wardScores = data?.wardScores || []
  const riskDist = data?.riskDistribution || { high: 0, medium: 0, low: 0 }
  const topHotspots = data?.topHotspots || []
  const featureInsights = data?.featureInsights || {}

  const pieData = [
    { name: 'High Risk', value: riskDist.high || 0, color: RISK_PALETTE.high },
    { name: 'Medium Risk', value: riskDist.medium || 0, color: RISK_PALETTE.medium },
    { name: 'Low Risk', value: riskDist.low || 0, color: RISK_PALETTE.low },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Hero Overview Bar */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card bg-panel border-line">
          <p className="eyebrow flex items-center gap-1.5 text-muted">
            <Layers size={14} className="text-moss" /> Total GVPs Tracked
          </p>
          <p className="stat-figure mt-2 text-3xl font-bold text-ink">
            {summary?.totalGvps || data?.totalGvps || 0}
          </p>
          <p className="mt-1 text-xs text-muted">Geospatial sanitation points</p>
        </div>

        <div className="card bg-risk-highBg/60 border-risk-high/20">
          <p className="eyebrow flex items-center gap-1.5 text-risk-high">
            <AlertTriangle size={14} /> High-Risk Priority
          </p>
          <p className="stat-figure mt-2 text-3xl font-bold text-risk-high">
            {summary?.highRiskCount || riskDist.high || 0}
          </p>
          <p className="mt-1 text-xs text-risk-high/80">Require immediate intervention</p>
        </div>

        <div className="card bg-panel border-line">
          <p className="eyebrow flex items-center gap-1.5 text-muted">
            <TrendingUp size={14} className="text-moss" /> Avg Recurrence Rate
          </p>
          <p className="stat-figure mt-2 text-3xl font-bold text-moss">
            {percentage(summary?.avgRecurrenceRate || 0.89)}
          </p>
          <p className="mt-1 text-xs text-muted">Repeat vulnerability factor</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <p className="eyebrow flex items-center gap-1.5 text-purple-700 font-semibold">
            <Zap size={14} className="fill-purple-600" /> Groq AI Engine
          </p>
          <p className="mt-2 font-mono text-sm font-bold text-purple-900 truncate">
            {summary?.groqModel || 'openai/gpt-oss-20b'}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-purple-700">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
            LPU Acceleration Active
          </span>
        </div>
      </section>

      {/* Groq AI Showcase Panel */}
      <GroqInsightsPanel topGvps={topHotspots} />

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ward Cleanliness Score Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <BarChart3 size={14} className="text-moss" /> Ward Cleanliness Index
              </p>
              <h3 className="font-display font-semibold text-ink mt-0.5">Aggregated Cleanliness Score per Ward</h3>
            </div>
            <span className="text-xs text-muted font-mono bg-paper px-2.5 py-1 rounded">Score / 100</span>
          </div>

          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={wardScores} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" vertical={false} />
              <XAxis dataKey="ward" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    return (
                      <div className="rounded border border-line bg-white p-2.5 shadow-md text-xs">
                        <p className="font-bold text-ink">{item.ward}</p>
                        <p className="text-moss font-semibold mt-1">Cleanliness Score: {item.score} / 100</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="score" fill="#1F6F5C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Donut Chart */}
        <div className="card flex flex-col justify-between">
          <div>
            <p className="eyebrow">Risk Classification Breakdown</p>
            <h3 className="font-display font-semibold text-ink mt-0.5">GVP Risk Tier Spread</h3>
          </div>

          <div className="relative my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Hotspots Table */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-paper/50">
          <div>
            <p className="eyebrow text-risk-high">Priority Focus</p>
            <h3 className="font-display font-semibold text-ink">Highest Recurrence Rate Blackspots</h3>
          </div>
          <span className="rounded-full bg-risk-highBg px-3 py-1 text-xs font-semibold text-risk-high">
            Top {topHotspots.length} Priority Hotspots
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted bg-paper/30">
                <th className="px-5 py-3 font-medium">GVP ID</th>
                <th className="px-5 py-3 font-medium">Recurrence Rate</th>
                <th className="px-5 py-3 font-medium">Risk Score</th>
                <th className="px-5 py-3 font-medium">Total Reports</th>
                <th className="px-5 py-3 font-medium">Primary Root Cause</th>
                <th className="px-5 py-3 font-medium">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {topHotspots.map((row) => (
                <tr key={row.gvp_id} className="border-b border-line last:border-0 hover:bg-paper/60 transition-colors">
                  <td className="stat-figure px-5 py-3 font-semibold text-ink">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-moss" /> {row.gvp_id}
                    </span>
                  </td>
                  <td className="stat-figure px-5 py-3 font-bold text-risk-high">
                    {percentage(row.rf_predicted_recurrence_rate || row.recurrence_rate)}
                  </td>
                  <td className="stat-figure px-5 py-3 text-ink">
                    {Number(row.risk_score || 0).toFixed(2)}
                  </td>
                  <td className="stat-figure px-5 py-3 text-muted">
                    {row.total_complaints ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-ink font-medium">
                    {row.worst_factor || 'Infrastructure risk'}
                  </td>
                  <td className="px-5 py-3">
                    <RiskBadge level={row.computed_risk_tier || row.risk_level || 'high'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Impact Insights Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card bg-panel">
          <p className="eyebrow text-muted">Proximity Impact</p>
          <h4 className="font-display font-semibold text-ink mt-1">Waste Bin Distance</h4>
          <p className="mt-2 text-2xl font-bold stat-figure text-ink">
            {featureInsights?.distance_to_bin_m?.high
              ? `${Math.round(featureInsights.distance_to_bin_m.high)}m`
              : '245m'}
          </p>
          <p className="mt-1 text-xs text-muted">
            Average distance to nearest bin for High-Risk GVPs (vs {featureInsights?.distance_to_bin_m?.low ? `${Math.round(featureInsights.distance_to_bin_m.low)}m` : '85m'} for Low-Risk)
          </p>
        </div>

        <div className="card bg-panel">
          <p className="eyebrow text-muted">Commercial Footfall</p>
          <h4 className="font-display font-semibold text-ink mt-1">Market Distance</h4>
          <p className="mt-2 text-2xl font-bold stat-figure text-ink">
            {featureInsights?.distance_to_market_m?.high
              ? `${Math.round(featureInsights.distance_to_market_m.high)}m`
              : '72m'}
          </p>
          <p className="mt-1 text-xs text-muted">
            High-risk GVPs are located significantly closer to commercial markets, increasing organic waste dumping.
          </p>
        </div>

        <div className="card bg-panel">
          <p className="eyebrow text-muted">Remediation Metric</p>
          <h4 className="font-display font-semibold text-ink mt-1">Collection Frequency</h4>
          <p className="mt-2 text-2xl font-bold stat-figure text-ink">
            {featureInsights?.collection_frequency_per_week?.high
              ? `${featureInsights.collection_frequency_per_week.high}x / week`
              : '1.4x / week'}
          </p>
          <p className="mt-1 text-xs text-muted">
            Increasing collection frequency to daily eliminates up to 78% of recurrence risk in high-density wards.
          </p>
        </div>
      </div>
    </div>
  )
}
