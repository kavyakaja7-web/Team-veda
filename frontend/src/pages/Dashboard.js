import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useGVPs from '../hooks/useGVPs.js'
import useComplaints from '../hooks/useComplaints.js'
import SummaryCards from '../components/SummaryCards.js'
import MapView from '../components/MapView.js'
import WardChart from '../components/WardChart.js'
import GVPTable from '../components/GVPTable.js'
import LoadingSpinner from '../components/LoadingSpinner.js'

function buildTrend(complaints) {
  const byDate = {}
  complaints.forEach((c) => {
    const date = (c.reported_date || c.created_at || c.date || '').slice(0, 10) || 'Unknown'
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

  if (gvpsLoading) return <LoadingSpinner label="Pulling in GVP data…" />

  if (gvpsError) {
    return (
      <div className="card border-risk-high/30 bg-risk-highBg text-risk-high">
        Couldn&apos;t load GVPs: {gvpsErr?.message}. Confirm the backend is running and
        VITE_API_BASE_URL is set correctly.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryCards gvps={gvpList} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapView gvps={gvpList} height={380} />
        </div>
        <WardChart gvps={gvpList} />
      </div>

      <div className="card">
        <p className="eyebrow mb-3">Complaint trends</p>
        {complaintsLoading ? (
          <LoadingSpinner label="Loading complaint trends…" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1F6F5C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div>
        <p className="eyebrow mb-3">High-risk GVPs</p>
        <GVPTable gvps={gvpList} highRiskOnly />
      </div>
    </div>
  )
}
