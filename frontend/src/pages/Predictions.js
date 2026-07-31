import { BrainCircuit } from 'lucide-react'
import { usePredictions } from '../hooks/useAnalytics.js'
import LoadingSpinner from '../components/LoadingSpinner.js'
import RiskBadge from '../components/RiskBadge.js'

export default function Predictions() {
  const { data, isLoading } = usePredictions()

  if (isLoading) return <LoadingSpinner label="Checking for the prediction model…" />

  if (!data?.available) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss/10 text-moss">
          <BrainCircuit size={22} />
        </span>
        <p className="font-display text-lg font-semibold text-ink">ML model coming soon</p>
        <p className="max-w-sm text-sm text-muted">
          This page will connect to <code className="stat-figure text-xs">GET /api/predictions</code> once
          the ML team ships the risk-forecasting model. No frontend changes will be needed then —
          just swap the mock in <code className="stat-figure text-xs">predictionService.js</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-4 py-3 font-medium">GVP</th>
            <th className="px-4 py-3 font-medium">Predicted risk</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {(data.predictions || []).map((p) => (
            <tr key={p.gvp_id || p.id} className="border-b border-line last:border-0">
              <td className="stat-figure px-4 py-3 text-ink">{p.gvp_id || p.id}</td>
              <td className="px-4 py-3">
                <RiskBadge level={p.predicted_risk || p.risk} />
              </td>
              <td className="stat-figure px-4 py-3 text-muted">
                {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
