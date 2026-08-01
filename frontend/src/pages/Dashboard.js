import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useGVPs from '../hooks/useGVPs.js'
import useComplaints from '../hooks/useComplaints.js'
import SummaryCards from '../components/SummaryCards.js'
import MapView from '../components/MapView.js'
import WardChart from '../components/WardChart.js'
import GVPTable from '../components/GVPTable.js'
import LoadingSpinner from '../components/LoadingSpinner.js'
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react'

function buildTrend(complaints) {
  const byDate = {}
  complaints.forEach((c) => {
    const date = (c.reported_date || c.created_at || c.date || '').slice(0, 10) || '2026-08-01'
    byDate[date] = (byDate[date] || 0) + 1
  })
  return Object.entries(byDate)
    .filter(([date]) => date !== 'Unknown')
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, count]) => ({ date, count }))
}

export default function Dashboard() {
  const { data: gvps, isLoading: gvpsLoading, isError: gvpsError, error: gvpsErr } = useGVPs()
  const { data: complaints, isLoading: complaintsLoading } = useComplaints()

  const gvpList = Array.isArray(gvps) ? gvps : gvps?.items || []
  const complaintList = Array.isArray(complaints) ? complaints : complaints?.items || []
  const trend = buildTrend(complaintList)

  if (gvpsLoading) return <LoadingSpinner label="Loading GVMC GIS Layers & GVP Recurrence Matrix…" />

  if (gvpsError) {
    return (
      <div className="card-cmd border-red-200 bg-red-50 text-red-700 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} />
          <div>
            <h3 className="font-bold">Backend Connection Issue</h3>
            <p className="text-xs mt-1">Couldn&apos;t load GVPs: {gvpsErr?.message}. Confirm the FastAPI backend is running.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enterprise KPI Summary Grid */}
      <SummaryCards gvps={gvpList} />

      {/* Main Command Center: GIS Map (2 Cols) + Ward Risk Breakdown (1 Col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="eyebrow flex items-center gap-1.5 text-slate-700 font-bold">
              <MapPin size={14} className="text-emerald-600" /> Live GIS Geospatial Intelligence
            </span>
            <span className="text-[11px] font-bold text-slate-500">GVMC Ward Boundaries & Bins Active</span>
          </div>
          <MapView gvps={gvpList} height={420} />
        </div>

        <div className="lg:col-span-4">
          <WardChart gvps={gvpList} />
        </div>
      </div>

      {/* Complaint Trends Line Chart */}
      <div className="card-cmd bg-white border border-slate-200 shadow-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="eyebrow flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-600" /> Grievance Inflow Trend
            </span>
            <h3 className="font-display font-bold text-slate-900 mt-0.5">
              Daily Citizen Sanitation Complaints
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            7-Day Window
          </span>
        </div>

        {complaintsLoading ? (
          <LoadingSpinner label="Aggregating complaint timeline…" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: '#059669' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Critical High-Risk GVP Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="eyebrow text-red-600 flex items-center gap-1.5 font-bold">
            <AlertTriangle size={14} /> Priority Recurrence Blackspots
          </span>
          <span className="text-xs text-slate-500">Sorted by modeled risk probability</span>
        </div>
        <GVPTable gvps={gvpList} highRiskOnly />
      </div>
    </div>
  )
}
