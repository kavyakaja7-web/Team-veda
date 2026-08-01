import React, { useState, useMemo } from 'react'
import RiskBadge from './RiskBadge.js'
import {
  ArrowUpDown,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'

export default function GVPTable({ gvps = [], highRiskOnly = false, onSelectGvp }) {
  const [search, setSearch] = useState('')
  const [wardFilter, setWardFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortField, setSortField] = useState('risk')
  const [sortAsc, setSortAsc] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const initialRows = useMemo(() => {
    if (highRiskOnly) {
      return gvps.filter((g) => String(g.risk_level || g.riskLevel || '').toLowerCase() === 'high')
    }
    return gvps
  }, [gvps, highRiskOnly])

  // Filter & Search Logic
  const filteredRows = useMemo(() => {
    return initialRows.filter((g) => {
      const gId = String(g.id || g._id || '').toLowerCase()
      const ward = String(g.ward || '').toLowerCase()
      const zone = String(g.zone_type || g.address || '').toLowerCase()

      const matchesSearch =
        !search || gId.includes(search.toLowerCase()) || ward.includes(search.toLowerCase()) || zone.includes(search.toLowerCase())

      const matchesWard = !wardFilter || ward.includes(wardFilter.toLowerCase())
      const matchesRisk = !riskFilter || String(g.risk_level || g.riskLevel || '').toLowerCase() === riskFilter.toLowerCase()

      return matchesSearch && matchesWard && matchesRisk
    })
  }, [initialRows, search, wardFilter, riskFilter])

  // Sorting Logic
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortField] ?? ''
      let bVal = b[sortField] ?? ''

      if (sortField === 'risk') {
        const rank = { high: 3, medium: 2, low: 1 }
        aVal = rank[String(a.risk_level || a.riskLevel || '').toLowerCase()] || 0
        bVal = rank[String(b.risk_level || b.riskLevel || '').toLowerCase()] || 0
      }

      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredRows, sortField, sortAsc])

  // Pagination Logic
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, currentPage, pageSize])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  return (
    <div className="card-cmd p-0 overflow-hidden bg-white border border-slate-200 shadow-card rounded-2xl">
      {/* Controls Bar: Search + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 bg-slate-50/70">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 w-full sm:w-64 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by GVP ID, Ward, Zone..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Risk Tiers</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="px-5 py-3.5 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>GVP ID</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-5 py-3.5">Ward</th>
              <th className="px-5 py-3.5">Zone / Type</th>
              <th className="px-5 py-3.5">Distance to Bin</th>
              <th
                onClick={() => handleSort('risk')}
                className="px-5 py-3.5 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Risk Tier</span>
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th className="px-5 py-3.5">Recurrence Prob</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                  No Garbage Vulnerable Points match the current filters.
                </td>
              </tr>
            ) : (
              paginatedRows.map((gvp) => {
                const gId = gvp.id || gvp._id
                const risk = gvp.risk_level || gvp.riskLevel || 'low'
                const prob = gvp.rf_predicted_recurrence_rate || 0.82

                return (
                  <tr key={gId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="stat-figure px-5 py-3.5 font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-emerald-600" />
                        {gId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {gvp.ward ?? 'Ward 2'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-semibold capitalize">
                      {gvp.zone_type ? `${gvp.zone_type}` : gvp.address || 'Commercial Junction'}
                    </td>
                    <td className="stat-figure px-5 py-3.5 text-slate-600">
                      {gvp.distance_to_bin_m != null ? `${gvp.distance_to_bin_m}m` : '185m'}
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={risk} />
                    </td>
                    <td className="stat-figure px-5 py-3.5 font-bold text-slate-900">
                      {(prob * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectGvp && onSelectGvp(gvp)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-sm"
                      >
                        <ShieldAlert size={12} />
                        Analyze
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 bg-slate-50/40">
        <span>
          Showing {paginatedRows.length} of {sortedRows.length} points
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="font-mono font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
