import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const PALETTE = ['#1F6F5C', '#E8A33D', '#C1443C', '#6B9E78', '#8A8F86']

function groupBy(items, key) {
  const counts = {}
  items.forEach((item) => {
    const val = item[key] || 'Unknown'
    counts[val] = (counts[val] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export function ComplaintCategoryChart({ complaints = [] }) {
  const data = groupBy(complaints, 'category')

  return (
    <div className="card">
      <p className="eyebrow mb-3">By category</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ComplaintStatusChart({ complaints = [] }) {
  const data = groupBy(complaints, 'status')

  return (
    <div className="card">
      <p className="eyebrow mb-3">By status</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DEDCD0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#1F6F5C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ComplaintCategoryChart
