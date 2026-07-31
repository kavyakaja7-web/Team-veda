import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function tallyByWard(gvps) {
  const counts = {}
  gvps.forEach((g) => {
    const ward = g.ward || 'Unassigned'
    counts[ward] = (counts[ward] || 0) + 1
  })
  return Object.entries(counts)
    .map(([ward, count]) => ({ ward, count }))
    .sort((a, b) => b.count - a.count)
}

export default function WardChart({ gvps = [] }) {
  const data = tallyByWard(gvps)

  return (
    <div className="card">
      <p className="eyebrow mb-3">GVPs by ward</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="ward"
            width={90}
            tick={{ fontSize: 12, fill: '#6B7268' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#4C8B63" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
