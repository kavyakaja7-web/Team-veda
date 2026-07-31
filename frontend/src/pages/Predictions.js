import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
  Activity,
  Crosshair,
} from 'lucide-react'
import api from '../services/api.js'
import { getHighRiskGvps } from '../services/riskService.js'
import LoadingSpinner from '../components/LoadingSpinner.js'
import RiskBadge from '../components/RiskBadge.js'

function percentage(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${(number * 100).toFixed(1)}%`
}

function rootCause(row) {
  return row.worst_factor || row.predicted_root_cause || 'Infrastructure risk requires inspection'
}

export default function Predictions() {
  const [selectedId, setSelectedId] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [explanationError, setExplanationError] = useState('')

  const riskQuery = useQuery({
    queryKey: ['high-risk-gvps'],
    queryFn: () => getHighRiskGvps({ limit: 50 }),
  })

  const rows = riskQuery.data?.data || []
  const selected = useMemo(
    () => rows.find((row) => row.gvp_id === selectedId) || rows[0],
    [rows, selectedId],
  )

  useEffect(() => {
    if (selected?.gvp_id && selected.gvp_id !== selectedId) {
      setSelectedId(selected.gvp_id)
    }
  }, [selected, selectedId])

  useEffect(() => {
    setExplanation(null)
    setExplanationError('')
  }, [selectedId])

  const explanationMutation = useMutation({
    mutationFn: async ({ gvpId, refresh }) => {
      const { data } = await api.post(`/api/explanations/${gvpId}`, null, {
        params: refresh ? { refresh: true } : {},
      })
      return data
    },
    onSuccess: (data) => {
      setExplanation(data)
      setExplanationError('')
    },
    onError: (error) => setExplanationError(error.message),
  })

  if (riskQuery.isLoading) return <LoadingSpinner label="Loading model predictions…" />

  if (riskQuery.isError) {
    return (
      <div className="card border-risk-high/30 bg-risk-highBg text-risk-high">
        Couldn&apos;t load model predictions: {riskQuery.error.message}. Run the backend training pipeline, then start FastAPI.
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="card text-center text-muted">
        No high-risk GVPs are available. Run <code>python scripts\train_model.py</code> first.
      </div>
    )
  }

  const highCount = rows.filter((row) => String(row.computed_risk_tier).toLowerCase() === 'high').length
  const explanationLines = explanation?.explanation?.split('\n').filter(Boolean) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-ink to-ink-light p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Target size={200} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400">
                <Activity size={18} />
              </span>
              <p className="eyebrow text-blue-300">ML Prediction Engine</p>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Predictive Risk Modeling</h2>
            <p className="mt-3 text-base leading-relaxed text-white/70">
              Our Random Forest model analyzes spatial clustering, historical complaints, and infrastructure data to predict which locations are mathematically most likely to become black spots again.
            </p>
          </div>
          <div className="flex gap-8 border-t border-white/10 pt-6 lg:border-t-0 lg:pt-0">
            <div>
              <p className="text-4xl font-light stat-figure text-blue-400">{rows.length}</p>
              <p className="mt-2 text-xs font-bold text-white/50 uppercase tracking-widest">Analyzed Spots</p>
            </div>
            <div>
              <p className="text-4xl font-light stat-figure text-risk-high">{highCount}</p>
              <p className="mt-2 text-xs font-bold text-white/50 uppercase tracking-widest">Critical Risks</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="card p-0 flex flex-col h-[700px] border-line shadow-card-hover overflow-hidden rounded-xl bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-5 bg-paper/50">
            <div>
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Crosshair size={18} className="text-blue-600" />
                Ranked Predictions
              </h3>
              <p className="text-xs text-muted mt-1">Sorted by modeled recurrence probability</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 border border-blue-100">Live Model Output</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {rows.map((row, index) => {
              const active = row.gvp_id === selected.gvp_id
              const riskNum = Number(row.rf_predicted_recurrence_rate)
              // Calculate a hue from 0 (red) to 120 (green). Wait, high risk should be red. So hue = (1 - riskNum) * 120.
              // We'll just use red for high, orange for medium, etc based on risk tier to be simple.
              const isHigh = String(row.computed_risk_tier).toLowerCase() === 'high'
              
              return (
                <button
                  key={row.gvp_id}
                  type="button"
                  onClick={() => setSelectedId(row.gvp_id)}
                  className={`group relative flex w-full flex-col gap-3 rounded-lg px-4 py-4 text-left transition-all duration-200 ${
                    active ? 'bg-blue-50/60 shadow-sm ring-1 ring-blue-500/20' : 'hover:bg-paper'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-line/50 text-muted group-hover:bg-line group-hover:text-ink'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-ink flex items-center gap-2">
                          {row.gvp_id}
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>}
                        </p>
                        <p className="text-xs text-muted font-medium mt-0.5 line-clamp-1">{rootCause(row)}</p>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <p className={`stat-figure text-lg font-bold ${isHigh ? 'text-risk-high' : 'text-risk-medium'}`}>
                        {percentage(row.rf_predicted_recurrence_rate)}
                      </p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted">Probability</p>
                    </div>
                  </div>
                  
                  {/* Progress bar visual */}
                  <div className="w-full h-1.5 bg-line/60 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-risk-high' : 'bg-risk-medium'}`}
                      style={{ width: `${riskNum * 100}%` }} 
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="space-y-6 overflow-y-auto h-[700px] pr-1">
          <section className="card p-6 border-line shadow-card-hover rounded-xl bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full pointer-events-none"></div>
            
            <div className="flex items-start justify-between gap-3 mb-6 relative z-10">
              <div>
                <p className="eyebrow text-blue-600">Inspection target</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-ink flex items-center gap-2">
                  <MapPin size={22} className="text-blue-600" />
                  {selected.gvp_id}
                </h3>
              </div>
              <RiskBadge level={selected.computed_risk_tier || 'high'} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-line bg-paper/40 p-4 transition-colors hover:bg-paper">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Recurrence Probability</p>
                <p className="mt-2 stat-figure text-3xl font-light text-risk-high">
                  {percentage(selected.rf_predicted_recurrence_rate)}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-paper/40 p-4 transition-colors hover:bg-paper">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Base Risk Score</p>
                <p className="mt-2 stat-figure text-3xl font-light text-ink">
                  {Number(selected.risk_score).toFixed(3)}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                  <Activity size={14} /> Model Features
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col justify-center p-3 rounded-lg bg-paper/60 border border-line/50">
                    <span className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">Complaints</span>
                    <span className="font-semibold text-lg">{selected.total_complaints != null ? selected.total_complaints : '—'}</span>
                  </div>
                  <div className="flex flex-col justify-center p-3 rounded-lg bg-paper/60 border border-line/50">
                    <span className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">Distance to bin</span>
                    <span className="font-semibold text-lg">{selected.distance_to_bin_m != null ? `${selected.distance_to_bin_m}m` : '—'}</span>
                  </div>
                  <div className="flex flex-col justify-center p-3 rounded-lg bg-paper/60 border border-line/50">
                    <span className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">Distance to market</span>
                    <span className="font-semibold text-lg">{selected.distance_to_market_m != null ? `${selected.distance_to_market_m}m` : '—'}</span>
                  </div>
                  <div className="flex flex-col justify-center p-3 rounded-lg bg-paper/60 border border-line/50">
                    <span className="text-[11px] uppercase tracking-wider text-muted font-bold mb-1">Collections/wk</span>
                    <span className="font-semibold text-lg">{selected.collection_frequency_per_week != null ? selected.collection_frequency_per_week : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-line/70">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Primary Risk Factor</p>
                <p className="font-medium text-ink leading-relaxed">{rootCause(selected)}</p>
              </div>

              <div className="mt-2 rounded-xl border border-moss/30 bg-gradient-to-r from-moss-light/40 to-transparent p-4">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-moss-dark">
                  <CheckCircle2 size={16} /> Prescribed Intervention
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90 font-medium">{selected.recommended_action}</p>
              </div>
            </div>
          </section>

          <section className="card p-6 border-violet-100 bg-gradient-to-br from-violet-50/90 to-white shadow-card-hover rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 shadow-sm text-white">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink">Groq Copilot</h3>
                  <p className="text-xs text-muted">AI Synthesis & Field Brief</p>
                </div>
              </div>
            </div>

            {explanationLines.length > 0 ? (
              <div className="mt-5 space-y-3">
                <div className="space-y-2">
                  {explanationLines.map((line, i) => (
                    <p key={i} className="text-sm text-ink/85 leading-relaxed bg-white/80 p-3 rounded-lg border border-violet-100 shadow-sm">{line}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-violet-500">
                    {explanation.cached ? 'Loaded from cache' : 'Generated live'} · {explanation.model}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-sm text-muted bg-white/60 p-4 rounded-lg border border-violet-100/60 shadow-sm">
                <p>Generate an AI brief to synthesize the model's features into an actionable summary for field officers. This aids rapid on-site inspection.</p>
              </div>
            )}

            {explanationError && (
              <div className="mt-4 rounded-lg border border-risk-high/30 bg-risk-highBg/80 p-3 text-sm text-risk-high">
                {explanationError}
              </div>
            )}

            <button
              type="button"
              disabled={explanationMutation.isPending}
              onClick={() => explanationMutation.mutate({ gvpId: selected.gvp_id, refresh: Boolean(explanation) })}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-violet-700 hover:shadow-md disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-violet-600 disabled:hover:shadow-none"
            >
              {explanationMutation.isPending ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {explanation ? 'Regenerate Brief' : 'Synthesize AI Brief'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
