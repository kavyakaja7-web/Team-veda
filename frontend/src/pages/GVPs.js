import React, { useMemo, useState } from 'react'
import useGVPs from '../hooks/useGVPs.js'
import Filters from '../components/Filters.js'
import GVPTable from '../components/GVPTable.js'
import MapView from '../components/MapView.js'
import LoadingSpinner from '../components/LoadingSpinner.js'

export default function GVPs() {
  const [filters, setFilters] = useState({ search: '', risk: '', ward: '' })
  const { data, isLoading, isError, error } = useGVPs()

  const gvpList = Array.isArray(data) ? data : data?.items || []

  const filtered = useMemo(() => {
    return gvpList.filter((g) => {
      const matchesSearch =
        !filters.search ||
        `${g.id || g._id} ${g.zone_type || ''} ${g.road_type || ''} ${g.address || g.location_name || ''}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      const matchesRisk =
        !filters.risk ||
        String(g.risk_level || g.riskLevel || '').toLowerCase() === filters.risk
      const matchesWard =
        !filters.ward || String(g.ward || '').toLowerCase().includes(filters.ward.toLowerCase())
      return matchesSearch && matchesRisk && matchesWard
    })
  }, [gvpList, filters])

  if (isLoading) return <LoadingSpinner label="Loading GVP Registry & GIS Points…" />

  if (isError) {
    return (
      <div className="card-cmd border-red-200 bg-red-50 text-red-700 p-6 rounded-2xl">
        Couldn&apos;t load GVPs: {error?.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Filters value={filters} onChange={setFilters} />
      <MapView gvps={filtered} height={360} />
      <GVPTable gvps={filtered} />
    </div>
  )
}
