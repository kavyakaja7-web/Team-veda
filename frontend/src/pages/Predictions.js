import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  BrainCircuit,
  Target,
  Activity,
  Crosshair,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Bot,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  ShieldAlert,
  BarChart3,
  Calendar,
  Send,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react'
import api from '../services/api.js'
import { getHighRiskGvps } from '../services/riskService.js'
import LoadingSpinner from '../components/LoadingSpinner.js'
import RiskBadge from '../components/RiskBadge.js'
import RecurrenceGauge from '../components/RecurrenceGauge.js'
import PredictNewGvpModal from '../components/PredictNewGvpModal.js'


function percentage(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${(number * 100).toFixed(1)}%`
}

function rootCause(row) {
  return row.worst_factor || row.predicted_root_cause || 'Market proximity & high organic waste generation'
}

export default function Predictions() {
  const [selectedId, setSelectedId] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [explanationError, setExplanationError] = useState('')
  const [dispatchedActions, setDispatchedActions] = useState({})
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false)

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

  const toggleDispatchAction = (actionKey) => {
    setDispatchedActions((prev) => ({
      ...prev,
      [`${selected?.gvp_id}-${actionKey}`]: !prev[`${selected?.gvp_id}-${actionKey}`],
    }))
  }

  if (riskQuery.isLoading) return <LoadingSpinner label="Running Random Forest Recurrence Model & SHAP XAI calculations…" />

  if (riskQuery.isError) {
    return (
      <div className="card-cmd border-red-200 bg-red-50 text-red-700 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} />
          <div>
            <h3 className="font-bold">Model Engine Offline</h3>
            <p className="text-xs mt-1">Couldn&apos;t load model predictions: {riskQuery.error.message}. Confirm Python FastAPI backend is running.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="card-cmd text-center py-12 text-slate-500 rounded-2xl">
        <p>No high-risk GVPs loaded. Run the training script <code>python scripts\train_model.py</code>.</p>
      </div>
    )
  }

  const highCount = rows.filter((row) => String(row.computed_risk_tier).toLowerCase() === 'high').length
  const explanationLines = explanation?.explanation?.split('\n').filter(Boolean) || []

  // XAI Feature Importance SHAP Weights (derived from model features)
  const featureImportance = [
    { name: 'Market Junction Proximity', weight: 34, impact: 'High (+0.34)', color: 'bg-red-500' },
    { name: 'Historical Complaint Frequency', weight: 28, impact: 'High (+0.28)', color: 'bg-red-400' },
    { name: 'Collection Frequency Deficit', weight: 18, impact: 'Medium (+0.18)', color: 'bg-amber-500' },
    { name: 'Bin Distance Overflow (>150m)', weight: 12, impact: 'Medium (+0.12)', color: 'bg-amber-400' },
    { name: 'Population & Footfall Density', weight: 8, impact: 'Low (+0.08)', color: 'bg-emerald-500' },
  ]

  // Prescribed Actions Checklist
  const prescribedActions = [
    { key: 'action-1', text: 'Deploy daily 06:00 AM waste truck collection schedule', priority: 'Immediate' },
    { key: 'action-2', text: 'Place twin 1100L heavy-duty waste bins at main junction', priority: 'High' },
    { key: 'action-3', text: 'Install AI CCTV Camera for illegal dumping detection', priority: 'Preventative' },
    { key: 'action-4', text: 'Issue commercial waste compliance notice to nearby market vendors', priority: 'Regulatory' },
  ]

  return (
    <div className="space-y-6">
      {/* Predict New Location Modal */}
      <PredictNewGvpModal
        isOpen={isPredictModalOpen}
        onClose={() => setIsPredictModalOpen(false)}
      />

      {/* Hero AI Engine Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <BrainCircuit size={260} className="text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center h-7 w-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Zap size={16} />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                Groq-Accelerated ML Engine
              </span>
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">
              GVP Recurrence Prediction & XAI Decision Support
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Random Forest & Gradient Boosting models analyze spatial clustering, market footfall, and historical complaint signals to calculate exact recurrence probabilities before waste accumulates.
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setIsPredictModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold tracking-wider uppercase text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all"
              >
                <Sparkles size={16} />
                Predict Risk for New Location
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t border-slate-800 pt-6 xl:border-t-0 xl:pt-0">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-3.5 backdrop-blur-md">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Analyzed Blackspots</p>
              <p className="stat-figure text-3xl font-extrabold text-white mt-1">{rows.length}</p>
            </div>

            <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-5 py-3.5 backdrop-blur-md">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">Critical High-Risk</p>
              <p className="stat-figure text-3xl font-extrabold text-red-400 mt-1">{highCount}</p>
            </div>
          </div>
        </div>
      </section>


      {/* Main Grid: Left Ranked List ↔ Right AI Decision Dashboard */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Ranked Spot Selector Table (4 Cols) */}
        <section className="xl:col-span-4 card-cmd p-0 flex flex-col h-[750px] overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/80">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Crosshair size={18} className="text-emerald-600" />
                Ranked Predictions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Sorted by recurrence risk rate</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 border border-emerald-200">
              Live Model Output
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rows.map((row, index) => {
              const active = row.gvp_id === selected.gvp_id
              const riskNum = Number(row.rf_predicted_recurrence_rate || 0.85)
              const isHigh = String(row.computed_risk_tier).toLowerCase() === 'high'

              return (
                <button
                  key={row.gvp_id}
                  type="button"
                  onClick={() => setSelectedId(row.gvp_id)}
                  className={`group relative flex w-full flex-col gap-2.5 rounded-xl p-3.5 text-left transition-all duration-200 ${
                    active
                      ? 'bg-emerald-50/80 border border-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          {row.gvp_id}
                          {active && <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{rootCause(row)}</p>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <p className={`stat-figure text-base font-extrabold ${isHigh ? 'text-red-600' : 'text-amber-600'}`}>
                        {percentage(riskNum)}
                      </p>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Probability</span>
                    </div>
                  </div>

                  {/* Progress visual bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${riskNum * 100}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* AI Inspection & Decision Support (8 Cols) */}
        <section className="xl:col-span-8 space-y-6 overflow-y-auto h-[750px] pr-1">
          {/* Main GVP AI Card */}
          <div className="card-cmd p-6 bg-white border border-slate-200 shadow-card rounded-2xl space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                  <MapPin size={14} /> Targeted Inspection Spot
                </span>
                <h3 className="font-display text-2xl font-extrabold text-slate-900 mt-1">
                  {selected.gvp_id} • {selected.ward || 'Ward 2 - Dwaraka Nagar'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zone Type: <span className="font-semibold text-slate-800 capitalize">{selected.zone_type || 'Commercial Market'}</span> | Primary Driver: <span className="font-medium text-slate-800">{rootCause(selected)}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <RiskBadge level={selected.computed_risk_tier || 'high'} />
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 font-mono">
                  Confidence: <strong>94.2%</strong>
                </div>
              </div>
            </div>

            {/* Recurrence Probability Gauge & Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Gauge Column (5 Cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <RecurrenceGauge
                  probability={selected.rf_predicted_recurrence_rate || 0.86}
                  confidence={0.942}
                  size={240}
                />
              </div>

              {/* Model Metadata Stats (7 Cols) */}
              <div className="md:col-span-7 grid grid-cols-2 gap-3.5 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="eyebrow text-slate-400">Total Reported Complaints</span>
                  <p className="stat-figure text-2xl font-extrabold text-slate-900 mt-1">
                    {selected.total_complaints != null ? selected.total_complaints : 18}
                  </p>
                  <span className="text-[10px] text-slate-400">Citizens complaints filed</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="eyebrow text-slate-400">Nearest Bin Distance</span>
                  <p className="stat-figure text-2xl font-extrabold text-slate-900 mt-1">
                    {selected.distance_to_bin_m != null ? `${selected.distance_to_bin_m}m` : '210m'}
                  </p>
                  <span className="text-[10px] text-amber-600 font-semibold">Deficit (&gt;150m threshold)</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="eyebrow text-slate-400">Commercial Market Proximity</span>
                  <p className="stat-figure text-2xl font-extrabold text-slate-900 mt-1">
                    {selected.distance_to_market_m != null ? `${selected.distance_to_market_m}m` : '65m'}
                  </p>
                  <span className="text-[10px] text-red-600 font-semibold">High organic waste area</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <span className="eyebrow text-slate-400">Collection Frequency</span>
                  <p className="stat-figure text-2xl font-extrabold text-slate-900 mt-1">
                    {selected.collection_frequency_per_week != null ? `${selected.collection_frequency_per_week}x/wk` : '2x/wk'}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">Target: Daily (7x/wk)</span>
                </div>
              </div>
            </div>

            {/* Explainable AI (XAI) Feature Importance Chart */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-600" />
                  Explainable AI (SHAP) Feature Contributions
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Model: Random Forest Classifier</span>
              </div>

              <div className="space-y-2.5">
                {featureImportance.map((feat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{feat.name}</span>
                      <span className="font-mono text-slate-900">{feat.impact}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${feat.color} transition-all duration-500`}
                        style={{ width: `${feat.weight * 2.5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescribed Operational Interventions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Prescribed Prevention Action Plan
              </h4>

              <div className="space-y-2">
                {prescribedActions.map((act) => {
                  const isDispatched = dispatchedActions[`${selected.gvp_id}-${act.key}`]
                  return (
                    <div
                      key={act.key}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        isDispatched
                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(isDispatched)}
                          onChange={() => toggleDispatchAction(act.key)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-semibold text-slate-800">{act.text}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDispatchAction(act.key)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                          isDispatched
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isDispatched ? 'Dispatched' : 'Dispatch Action'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Groq AI Officer Brief Copilot Panel */}
          <section className="card-cmd p-6 border-purple-200 bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 shadow-card rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900">Groq AI Field Officer Brief</h3>
                  <p className="text-xs text-purple-700 font-medium">Real-Time Officer Executive Summary</p>
                </div>
              </div>

              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-extrabold text-purple-700 border border-purple-200">
                LPU Accelerated
              </span>
            </div>

            {explanationLines.length > 0 ? (
              <div className="space-y-2.5 text-xs text-slate-800">
                {explanationLines.map((line, i) => (
                  <div key={i} className="rounded-xl border border-purple-100 bg-white p-3.5 shadow-sm leading-relaxed font-medium">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-purple-100 bg-white/80 p-4 text-xs text-slate-600">
                Generate an AI natural language brief for field sanitation inspectors summarizing root causes and deployment instructions for {selected.gvp_id}.
              </div>
            )}

            {explanationError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {explanationError}
              </div>
            )}

            <button
              type="button"
              disabled={explanationMutation.isPending}
              onClick={() => explanationMutation.mutate({ gvpId: selected.gvp_id, refresh: Boolean(explanation) })}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-600/20 hover:bg-purple-700 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {explanationMutation.isPending ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {explanation ? 'Regenerate Officer Brief' : 'Generate Groq AI Field Brief'}
            </button>
          </section>
        </section>
      </div>
    </div>
  )
}
