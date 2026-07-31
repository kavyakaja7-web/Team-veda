import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useAnalytics } from '../hooks/useAnalytics.js'
import LoadingSpinner from '../components/LoadingSpinner.js'

export default function Analytics() {
  const { data, isLoading } = useAnalytics()

  if (isLoading) return <LoadingSpinner label="Loading analytics…" />

  const wardScores = data?.wardScores || []

  return (
    <div className="space-y-6">
      {!data?.available && (
        <div className="card border-moss/30 bg-moss/5 text-sm text-ink">
          <p className="font-medium text-moss">Placeholder data</p>
          <p className="text-muted mt-1">
            This view is showing mock ward scores. Once{' '}
            <code className="stat-figure text-xs">GET /api/analytics/features</code> is live on the
            backend, swap <code className="stat-figure text-xs">analyticsService.js</code> over and this
            chart updates automatically — no component changes needed.
          </p>
        </div>
      )}

      <div className="card">
        <p className="eyebrow mb-3">Ward cleanliness score</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={wardScores}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" vertical={false} />
            <XAxis dataKey="ward" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="score" fill="#1F6F5C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
