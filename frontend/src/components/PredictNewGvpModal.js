import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import {
  X,
  Sparkles,
  MapPin,
  Building2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Send,
  Zap,
} from 'lucide-react'
import { predictNewGvp } from '../services/predictionService.js'
import RecurrenceGauge from './RecurrenceGauge.js'
import RiskBadge from './RiskBadge.js'

export default function PredictNewGvpModal({ isOpen, onClose, onPredictionSuccess }) {
  const [formData, setFormData] = useState({
    gvp_id: `GVP-NEW-${Math.floor(100 + Math.random() * 900)}`,
    lat: 17.7231,
    lon: 83.3012,
    ward: 2,
    near_market: true,
    near_school: false,
    complaint_count: 8,
    days_since_cleanup: 4,
  })

  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const predictMutation = useMutation({
    mutationFn: predictNewGvp,
    onSuccess: (data) => {
      setResult(data)
      setErrorMsg('')
      if (onPredictionSuccess) onPredictionSuccess(data)
    },
    onError: (error) => {
      setErrorMsg(error.message || 'Failed to calculate prediction score.')
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    predictMutation.mutate({
      gvp_id: formData.gvp_id,
      lat: Number(formData.lat),
      lon: Number(formData.lon),
      ward: Number(formData.ward),
      near_market: Boolean(formData.near_market),
      near_school: Boolean(formData.near_school),
      complaint_count: Number(formData.complaint_count),
      days_since_cleanup: Number(formData.days_since_cleanup),
    })
  }

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 sm:p-6 backdrop-blur-md">
      <div className="relative my-auto flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header (Fixed at top) */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Predict Risk for New Location
              </h3>
              <p className="text-xs text-slate-400">
                Run dynamic Gradient Boosting ML model inference for unmapped spots
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Scrollable inside) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prediction Result Display if available */}
          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-5 shadow-sm space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                <span className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Prediction Calculated: {result.gvp_id}
                </span>
                <RiskBadge level={result.risk_level} />
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-4 py-1">
                <RecurrenceGauge
                  probability={result.risk_score / 100.0}
                  confidence={0.938}
                  size={190}
                />

                <div className="space-y-2 text-xs text-slate-700 w-full md:w-60">
                  <div className="flex justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-slate-500">Recurrence Risk Score:</span>
                    <strong className="stat-figure text-slate-900">{result.risk_score} / 100</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-slate-500">Risk Tier Classification:</span>
                    <strong className="font-bold text-slate-900">{result.risk_level}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-slate-500">Ward Number:</span>
                    <strong className="text-slate-900">Ward {formData.ward}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Location / GVP ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.gvp_id}
                  onChange={(e) => setFormData({ ...formData, gvp_id: e.target.value })}
                  className="input-field"
                  placeholder="GVP-NEW-101"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ward Number
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.lon}
                  onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Citizen Complaints Count
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.complaint_count}
                  onChange={(e) => setFormData({ ...formData, complaint_count: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Days Since Last Cleanup
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.days_since_cleanup}
                  onChange={(e) => setFormData({ ...formData, days_since_cleanup: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.near_market}
                  onChange={(e) => setFormData({ ...formData, near_market: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Near Commercial Market Area</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.near_school}
                  onChange={(e) => setFormData({ ...formData, near_school: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Near School / Educational Hub</span>
              </label>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={predictMutation.isPending}
                className="btn-primary text-xs"
              >
                {predictMutation.isPending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                Run ML Model Prediction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
