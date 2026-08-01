import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bell,
  Search,
  Clock,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import PredictNewGvpModal from './PredictNewGvpModal.js'

const TITLES = {
  '/': { title: 'Executive Command Dashboard', category: 'Live Sanitation Operations' },
  '/predictions': { title: 'AI Recurrence Prediction Engine', category: 'Explaining & Preventing Blackspots' },
  '/analytics': { title: 'Sanitation Analytics & AI Models', category: 'Ward Performance Matrix' },
  '/gvps': { title: 'Garbage Vulnerable Points (GVPs)', category: 'Geospatial Registry' },
  '/complaints': { title: 'Citizen Complaints Hub', category: 'Grievance Resolution Center' },
  '/cleanups': { title: 'Cleanup Operational Logs', category: 'Waste Recovery & Sanitation Teams' },
}

export default function Navbar() {
  const { pathname } = useLocation()
  const { title, category } = TITLES[pathname] || {
    title: 'Smart City Command Center',
    category: 'GVMC Operations',
  }

  const [time, setTime] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false)


  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-3.5 backdrop-blur-md">
      {/* Predict New Location Modal */}
      <PredictNewGvpModal
        isOpen={isPredictModalOpen}
        onClose={() => setIsPredictModalOpen(false)}
      />

      {/* Title & Eyebrow */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-600 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {category}
        </span>
        <h1 className="font-display text-lg font-bold text-slate-900 leading-tight">
          {title}
        </h1>
      </div>

      {/* Right Controls: Search, Zone, Live Clock, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Predict New Spot Quick Action */}
        <button
          type="button"
          onClick={() => setIsPredictModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
        >
          <Sparkles size={14} />
          <span>Predict GVP</span>
        </button>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-700 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all w-64">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GVP ID, Ward, Zone..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 sm:inline-block">
            ⌘K
          </kbd>
        </div>

        {/* City / Zone Picker */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
          <Building2 size={14} className="text-emerald-600" />
          <span>GVMC Central Zone</span>
        </div>

        {/* Live Clock Indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-mono font-medium text-slate-600">
          <Clock size={14} className="text-slate-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>


        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500" />
                  Live Operational Alerts
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="rounded-xl border border-red-100 bg-red-50/60 p-2.5">
                  <p className="font-bold text-red-800">Critical Risk Detected: GVP-102</p>
                  <p className="text-red-600 mt-0.5">Recurrence probability jumped to 94.2% in Ward 2 market area.</p>
                  <span className="text-[10px] text-red-400 mt-1 block">2 mins ago</span>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
                  <p className="font-bold text-emerald-800">Cleanup Confirmed</p>
                  <p className="text-emerald-700 mt-0.5">Team Alpha completed 140kg clearing at GVP-104.</p>
                  <span className="text-[10px] text-emerald-500 mt-1 block">18 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-bold text-white shadow-sm">
            MC
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="font-semibold text-xs text-slate-900 leading-none">
              Command Officer
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">GVMC Officer #402</span>
          </div>
        </div>
      </div>
    </header>
  )
}
