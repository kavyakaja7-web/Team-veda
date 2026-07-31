import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import useCleanups from '../hooks/useCleanups.js'
import LoadingSpinner from '../components/LoadingSpinner.js'

function groupSum(items, key, valueKey) {
  const totals = {}
  items.forEach((item) => {
    const k = item[key] || 'Unknown'
    totals[k] = (totals[k] || 0) + (Number(item[valueKey]) || 0)
  })
  return Object.entries(totals).map(([name, value]) => ({ name, value }))
}

export default function Cleanups() {
  const { data, isLoading, isError, error } = useCleanups()
  const cleanups = Array.isArray(data) ? data : data?.items || []

  if (isLoading) return <LoadingSpinner label="Loading cleanup history…" />

  if (isError) {
    return (
      <div className="card border-risk-high/30 bg-risk-highBg text-risk-high">
        Couldn&apos;t load cleanups: {error?.message}
      </div>
    )
  }

  const wasteByTeam = groupSum(cleanups, 'cleaned_by', 'waste_collected_kg')
  const cleanupsByTeam = cleanups.reduce((acc, c) => {
    const team = c.cleaned_by || c.team || c.assigned_team || 'Unassigned'
    acc[team] = (acc[team] || 0) + 1
    return acc
  }, {})
  const teamData = Object.entries(cleanupsByTeam).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
          <p className="eyebrow mb-3">Waste collected by team (kg)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wasteByTeam}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#E8A33D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="eyebrow mb-3">Cleanups count by team</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#1F6F5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-4 py-3 font-medium">Cleanup ID</th>
              <th className="px-4 py-3 font-medium">GVP ID</th>
              <th className="px-4 py-3 font-medium">Cleanup Team</th>
              <th className="px-4 py-3 font-medium">Waste Collected</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Cleaned Date</th>
            </tr>
          </thead>
          <tbody>
            {cleanups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No cleanups logged yet.
                </td>
              </tr>
            )}
            {cleanups.map((c) => (
              <tr key={c.id || c._id} className="border-b border-line last:border-0 hover:bg-paper/70">
                <td className="stat-figure px-4 py-3 text-ink">{c.id || c._id}</td>
                <td className="px-4 py-3 text-muted">{c.gvp_id || c.gvpId || '—'}</td>
                <td className="px-4 py-3 text-muted">{c.cleaned_by || c.team || c.assigned_team || '—'}</td>
                <td className="stat-figure px-4 py-3 text-ink">
                  {c.waste_collected_kg != null ? `${Number(c.waste_collected_kg)} kg` : '—'}
                </td>
                <td className="stat-figure px-4 py-3 text-ink">
                  {c.duration_hours != null ? `${Number(c.duration_hours)} hrs` : '—'}
                </td>
                <td className="px-4 py-3 text-muted">
                  {(c.cleaned_date || c.completed_at || c.date || '').slice(0, 10) || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
