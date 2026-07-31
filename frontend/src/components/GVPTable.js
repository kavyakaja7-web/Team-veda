import RiskBadge from './RiskBadge.js'

export default function GVPTable({ gvps = [], highRiskOnly = false }) {
  const rows = highRiskOnly
    ? gvps.filter((g) => String(g.risk_level || g.riskLevel || '').toLowerCase() === 'high')
    : gvps

  if (rows.length === 0) {
    return (
      <div className="card text-center text-sm text-muted">
        No GVPs match the current filters yet.
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-4 py-3 font-medium">GVP ID</th>
            <th className="px-4 py-3 font-medium">Ward</th>
            <th className="px-4 py-3 font-medium">Zone / Type</th>
            <th className="px-4 py-3 font-medium">Distance to Bin</th>
            <th className="px-4 py-3 font-medium">Risk Level</th>
            <th className="px-4 py-3 font-medium">First Reported</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((gvp) => (
            <tr key={gvp.id || gvp._id} className="border-b border-line last:border-0 hover:bg-paper/70">
              <td className="stat-figure px-4 py-3 text-ink">{gvp.id || gvp._id}</td>
              <td className="px-4 py-3 text-muted">{gvp.ward ?? '—'}</td>
              <td className="px-4 py-3 text-ink capitalize">
                {gvp.zone_type ? `${gvp.zone_type} (${gvp.road_type || 'road'})` : gvp.address || gvp.location_name || '—'}
              </td>
              <td className="stat-figure px-4 py-3 text-muted">
                {gvp.distance_to_bin_m != null ? `${gvp.distance_to_bin_m} m` : '—'}
              </td>
              <td className="px-4 py-3">
                <RiskBadge level={gvp.risk_level || gvp.riskLevel || 'low'} />
              </td>
              <td className="px-4 py-3 text-muted">
                {gvp.first_reported_date || gvp.last_inspected || gvp.lastInspected || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
