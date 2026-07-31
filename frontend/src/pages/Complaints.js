import useComplaints from '../hooks/useComplaints.js'
import { ComplaintCategoryChart, ComplaintStatusChart } from '../components/ComplaintChart.js'
import LoadingSpinner from '../components/LoadingSpinner.js'

export default function Complaints() {
  const { data, isLoading, isError, error } = useComplaints()
  const complaints = Array.isArray(data) ? data : data?.items || []

  if (isLoading) return <LoadingSpinner label="Loading complaints…" />

  if (isError) {
    return (
      <div className="card border-risk-high/30 bg-risk-highBg text-risk-high">
        Couldn&apos;t load complaints: {error?.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ComplaintCategoryChart complaints={complaints} />
        <ComplaintStatusChart complaints={complaints} />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">GVP</th>
              <th className="px-4 py-3 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No complaints reported yet.
                </td>
              </tr>
            )}
            {complaints.map((c) => (
              <tr key={c.id || c._id} className="border-b border-line last:border-0 hover:bg-paper/70">
                <td className="stat-figure px-4 py-3 text-ink">{c.id || c._id}</td>
                <td className="px-4 py-3 text-ink">{c.category || '—'}</td>
                <td className="px-4 py-3 text-muted">{c.status || '—'}</td>
                <td className="px-4 py-3 text-muted">{c.gvp_id || c.gvpId || '—'}</td>
                <td className="px-4 py-3 text-muted">{(c.reported_date || c.created_at || c.date || '').slice(0, 10) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
