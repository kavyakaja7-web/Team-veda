import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'

const TITLES = {
  '/': 'Dashboard',
  '/gvps': 'Garbage Vulnerable Points',
  '/complaints': 'Complaints',
  '/cleanups': 'Cleanups',
  '/analytics': 'Analytics',
  '/predictions': 'Predictions',
}

export default function Navbar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Clean City'

  return (
    <header className="flex items-center justify-between border-b border-line bg-panel px-6 py-4">
      <div>
        <p className="eyebrow">Live overview</p>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded border border-line bg-paper px-3 py-1.5">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Search wards, GVP IDs…"
            className="bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="rounded border border-line bg-paper p-2 text-muted hover:text-ink"
        >
          <Bell size={16} />
        </button>
        <div className="h-8 w-8 rounded-full bg-moss/10 border border-moss/30 flex items-center justify-center text-xs font-semibold text-moss">
          CC
        </div>
      </div>
    </header>
  )
}
