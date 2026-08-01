import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid,
  MapPin,
  MessageSquareWarning,
  Sparkles,
  LineChart,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/predictions', label: 'AI Prevention Engine', icon: BrainCircuit, badge: 'AI' },
  { to: '/analytics', label: 'Analytics & Models', icon: LineChart },
  { to: '/gvps', label: 'Garbage Points', icon: MapPin },
  { to: '/complaints', label: 'Complaints Hub', icon: MessageSquareWarning },
  { to: '/cleanups', label: 'Cleanup Logs', icon: Sparkles },
]

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  return (
    <aside
      className={`relative hidden md:flex shrink-0 flex-col bg-slate-950 text-slate-200 border-r border-slate-800/80 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={22} className="stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col whitespace-nowrap overflow-hidden"
            >
              <span className="font-display font-extrabold text-sm text-white tracking-tight leading-none">
                GVMC SMART CITY
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400 mt-1">
                Sanitation Command
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Navigation Menu
          </p>
        )}

        {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-white border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 font-semibold">{label}</span>
                )}

                {!isCollapsed && badge && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 animate-pulse">
                    {badge}
                  </span>
                )}

                {/* Tooltip on Collapsed Hover */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block whitespace-nowrap z-50 border border-slate-800">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom AI Status Box */}
      <div className="border-t border-slate-800/80 p-3">
        {!isCollapsed ? (
          <div className="rounded-xl border border-purple-900/60 bg-gradient-to-br from-purple-950/80 to-slate-900 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-purple-300">
                <Zap size={14} className="fill-purple-400 text-purple-400" />
                Groq AI LPU
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Recurrence model running live inference at &lt;50ms latency.
            </p>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800 text-purple-300"
              title="Groq LPU AI Active"
            >
              <Zap size={18} className="fill-purple-400" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
