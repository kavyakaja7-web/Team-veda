import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  MapPin,
  MessageSquareWarning,
  Sparkles,
  LineChart,
  BrainCircuit,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/gvps', label: 'GVPs', icon: MapPin },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { to: '/cleanups', label: 'Cleanups', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/predictions', label: 'Predictions', icon: BrainCircuit },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-ink text-white">
      <div className="px-5 py-6">
        <p className="font-display text-lg font-semibold leading-tight">Clean City</p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">Control Room</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-moss text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/40">
        Backend: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
      </div>
    </aside>
  )
}
