import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Sparkles, RefreshCw, Zap, Cpu, CheckCircle2 } from 'lucide-react'
import api from '../services/api.js'

export default function GroqInsightsPanel({ topGvps = [] }) {
  const [selectedGvpId, setSelectedGvpId] = useState(topGvps[0]?.gvp_id || 'GVP066')
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')

  const analysisMutation = useMutation({
    mutationFn: async ({ gvpId, refresh }) => {
      const { data } = await api.post(`/api/explanations/${gvpId}`, null, {
        params: refresh ? { refresh: true } : {},
      })
      return data
    },
    onSuccess: (data) => {
      setAnalysis(data)
      setError('')
    },
    onError: (err) => {
      setError(err.message || 'Groq API request failed.')
    },
  })

  const lines = analysis?.explanation?.split('\n').filter(Boolean) || []

  return (
    <div className="groq-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-purple-950">Groq AI Executive Briefing</h3>
              <span className="groq-badge">
                <Zap size={11} className="fill-purple-600 text-purple-600" />
                LPU-Powered
              </span>
            </div>
            <p className="text-xs text-purple-700/80 mt-0.5">
              Generates instant, data-grounded sanitation policy briefings powered by Groq LPU Inference Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 rounded bg-purple-100/80 px-2.5 py-1 text-xs font-mono font-medium text-purple-800">
            <Cpu size={13} />
            openai/gpt-oss-20b
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <label className="block text-xs font-medium uppercase tracking-wider text-purple-800">
            Select Blackspot to Analyze
          </label>
          <select
            value={selectedGvpId}
            onChange={(e) => {
              setSelectedGvpId(e.target.value)
              setAnalysis(null)
              setError('')
            }}
            className="w-full rounded border border-purple-200 bg-white px-3 py-2 text-sm text-ink focus:border-purple-500 focus:outline-none"
          >
            {topGvps.length > 0 ? (
              topGvps.map((g) => (
                <option key={g.gvp_id} value={g.gvp_id}>
                  {g.gvp_id} — {g.worst_factor || 'High Recurrence Risk'}
                </option>
              ))
            ) : (
              <option value="GVP066">GVP066 — High Recurrence Risk</option>
            )}
          </select>

          <button
            type="button"
            disabled={analysisMutation.isPending}
            onClick={() =>
              analysisMutation.mutate({
                gvpId: selectedGvpId,
                refresh: Boolean(analysis),
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {analysisMutation.isPending ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Generating Groq Brief…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {analysis ? 'Re-run Groq Analysis' : 'Run Groq AI Analysis'}
              </>
            )}
          </button>

          <p className="text-[11px] text-purple-600/70 text-center">
            Zero hallucination guardrails strictly enforced
          </p>
        </div>

        <div className="lg:col-span-2">
          {lines.length > 0 ? (
            <div className="space-y-3 rounded-lg border border-purple-200/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-800">
                  <CheckCircle2 size={14} className="text-purple-600" />
                  AI Briefing for {analysis.gvp_id}
                </span>
                <span className="text-[11px] text-purple-500 font-mono">
                  {analysis.cached ? '⚡ Cached Response' : '🔥 Live LPU Output'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-ink leading-relaxed">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0" />
                    <p className="font-medium text-slate-800">{line}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-[11px] text-purple-500 flex items-center justify-between border-t border-purple-100">
                <span>Model: {analysis.model}</span>
                <span>Generated at: {analysis.generated_at ? new Date(analysis.generated_at).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Groq API Error</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-purple-200 bg-white/50 p-6 text-center text-purple-600">
              <Sparkles size={24} className="mb-2 text-purple-400" />
              <p className="text-sm font-medium text-purple-900">Select a GVP location and click Run Groq AI Analysis</p>
              <p className="text-xs text-purple-600 mt-1">
                Groq translates Random Forest feature importance and geospatial metrics into structured officer briefings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
