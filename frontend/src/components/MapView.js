import React, { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  Polygon,
  Marker,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import {
  Layers,
  Flame,
  MapPin,
  Trash2,
  Truck,
  ShieldAlert,
  Eye,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'

const DEFAULT_CENTER = [17.7231, 83.3012] // Visakhapatnam (GVMC)

const RISK_COLOR = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
}

// Sample Ward Boundary Polygons for Visakhapatnam Command Center
const WARD_BOUNDARIES = [
  {
    id: 'ward-1',
    name: 'Ward 1 - Siripuram',
    riskScore: 78,
    positions: [
      [17.728, 83.310],
      [17.735, 83.315],
      [17.732, 83.328],
      [17.722, 83.322],
    ],
  },
  {
    id: 'ward-2',
    name: 'Ward 2 - Dwaraka Nagar',
    riskScore: 92,
    positions: [
      [17.722, 83.300],
      [17.728, 83.310],
      [17.720, 83.318],
      [17.712, 83.308],
    ],
  },
  {
    id: 'ward-3',
    name: 'Ward 3 - Jagadamba Junction',
    riskScore: 84,
    positions: [
      [17.712, 83.300],
      [17.718, 83.310],
      [17.708, 83.315],
      [17.702, 83.302],
    ],
  },
  {
    id: 'ward-4',
    name: 'Ward 4 - Gajuwaka Market',
    riskScore: 65,
    positions: [
      [17.700, 83.285],
      [17.710, 83.295],
      [17.702, 83.302],
      [17.692, 83.290],
    ],
  },
  {
    id: 'ward-5',
    name: 'Ward 5 - Madhurawada Central',
    riskScore: 42,
    positions: [
      [17.735, 83.315],
      [17.745, 83.330],
      [17.738, 83.340],
      [17.728, 83.325],
    ],
  },
]

// Mock Smart Garbage Bins with Live Capacity Fill Levels
const SMART_BINS = [
  { id: 'BIN-101', lat: 17.7245, lng: 83.305, fillLevel: 88, ward: 'Ward 2', status: 'Overflow Warning' },
  { id: 'BIN-102', lat: 17.7210, lng: 83.312, fillLevel: 94, ward: 'Ward 1', status: 'Overflow Warning' },
  { id: 'BIN-103', lat: 17.7150, lng: 83.308, fillLevel: 45, ward: 'Ward 3', status: 'Normal' },
  { id: 'BIN-104', lat: 17.7050, lng: 83.298, fillLevel: 30, ward: 'Ward 4', status: 'Normal' },
  { id: 'BIN-105', lat: 17.7320, lng: 83.322, fillLevel: 72, ward: 'Ward 5', status: 'Moderate' },
]

// Mock Municipal Waste Truck Collection Routes
const COLLECTION_ROUTES = [
  {
    id: 'route-north',
    name: 'Route 1 - Commercial Belt (Truck #GVMC-04)',
    color: '#3B82F6',
    positions: [
      [17.728, 83.310],
      [17.725, 83.308],
      [17.722, 83.300],
      [17.718, 83.310],
    ],
  },
  {
    id: 'route-south',
    name: 'Route 2 - Market & Residential (Truck #GVMC-09)',
    color: '#8B5CF6',
    positions: [
      [17.712, 83.300],
      [17.708, 83.315],
      [17.702, 83.302],
      [17.700, 83.285],
    ],
  },
]

// Leaflet Heatmap Layer Helper Component
function HeatmapLayer({ points }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !L.heatLayer) return

    const heatPoints = points.map((p) => [
      p._parsedLat,
      p._parsedLng,
      p.risk_level === 'high' ? 0.9 : p.risk_level === 'medium' ? 0.6 : 0.3,
    ])

    const heat = L.heatLayer(heatPoints, {
      radius: 25,
      blur: 15,
      maxZoom: 15,
      gradient: { 0.4: '#10B981', 0.65: '#F59E0B', 1.0: '#EF4444' },
    }).addTo(map)

    return () => {
      map.removeLayer(heat)
    }
  }, [map, points])

  return null
}

export default function MapView({ gvps = [], height = 480, onSelectGVP }) {
  const [layers, setLayers] = useState({
    heatmap: true,
    markers: true,
    wards: true,
    bins: true,
    routes: true,
  })

  const [activeFilterRisk, setActiveFilterRisk] = useState('all')

  const points = gvps
    .map((g) => {
      const lat = g.lat ?? g.location?.coordinates?.[1]
      const lng = g.lng ?? g.lon ?? g.location?.coordinates?.[0]
      return { ...g, _parsedLat: lat, _parsedLng: lng }
    })
    .filter((g) => g._parsedLat != null && g._parsedLng != null)
    .filter((g) => {
      if (activeFilterRisk === 'all') return true
      return String(g.risk_level || g.riskLevel || '').toLowerCase() === activeFilterRisk
    })

  const center = points.length ? [points[0]._parsedLat, points[0]._parsedLng] : DEFAULT_CENTER

  const toggleLayer = (layerName) => {
    setLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }))
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-card transition-all duration-300" style={{ height }}>
      {/* GIS Control Overlay Toolbar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/85 p-1.5 text-xs text-white backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-1.5 px-2 py-1 font-bold text-emerald-400 border-r border-white/10">
          <Layers size={14} />
          <span>GIS Layers</span>
        </div>

        <button
          type="button"
          onClick={() => toggleLayer('heatmap')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            layers.heatmap
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Flame size={13} />
          Heatmap
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('markers')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            layers.markers
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <MapPin size={13} />
          GVPs ({points.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('wards')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            layers.wards
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Layers size={13} />
          Wards
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('bins')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            layers.bins
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Trash2 size={13} />
          Bins
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('routes')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
            layers.routes
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Truck size={13} />
          Routes
        </button>
      </div>

      {/* Risk Filter Selector (Top Right) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 rounded-xl border border-white/20 bg-slate-900/85 p-1 text-xs text-white backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={() => setActiveFilterRisk('all')}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
            activeFilterRisk === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveFilterRisk('high')}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
            activeFilterRisk === 'high' ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'text-slate-400 hover:text-red-400'
          }`}
        >
          High Risk
        </button>
        <button
          type="button"
          onClick={() => setActiveFilterRisk('medium')}
          className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
            activeFilterRisk === 'medium' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'text-slate-400 hover:text-amber-400'
          }`}
        >
          Medium
        </button>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0F172A' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & GVMC GIS'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Heatmap Layer */}
        {layers.heatmap && <HeatmapLayer points={points} />}

        {/* Ward Boundaries Polygon Layer */}
        {layers.wards &&
          WARD_BOUNDARIES.map((ward) => (
            <Polygon
              key={ward.id}
              positions={ward.positions}
              pathOptions={{
                color: ward.riskScore > 80 ? '#EF4444' : ward.riskScore > 60 ? '#F59E0B' : '#3B82F6',
                weight: 1.5,
                dashArray: '4, 6',
                fillColor: ward.riskScore > 80 ? '#EF4444' : '#3B82F6',
                fillOpacity: 0.08,
              }}
            >
              <Popup>
                <div className="p-1">
                  <span className="font-bold text-slate-900 text-sm">{ward.name}</span>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Recurrence Risk Score:</span>
                    <strong className={ward.riskScore > 80 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                      {ward.riskScore}/100
                    </strong>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

        {/* Waste Truck Collection Routes Layer */}
        {layers.routes &&
          COLLECTION_ROUTES.map((route) => (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{
                color: route.color,
                weight: 3.5,
                opacity: 0.8,
                dashArray: '8, 8',
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-900">{route.name}</p>
                  <p className="text-slate-500 mt-0.5">Active Sanitation Dispatch Route</p>
                </div>
              </Popup>
            </Polyline>
          ))}

        {/* Smart Garbage Bins Markers */}
        {layers.bins &&
          SMART_BINS.map((bin) => (
            <CircleMarker
              key={bin.id}
              center={[bin.lat, bin.lng]}
              radius={6}
              pathOptions={{
                color: bin.fillLevel > 80 ? '#EF4444' : bin.fillLevel > 50 ? '#F59E0B' : '#10B981',
                fillColor: bin.fillLevel > 80 ? '#EF4444' : bin.fillLevel > 50 ? '#F59E0B' : '#10B981',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-slate-900">{bin.id}</strong>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      bin.fillLevel > 80 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {bin.fillLevel}% Full
                    </span>
                  </div>
                  <p className="text-slate-600">{bin.ward} Smart Bin Sensor</p>
                  <p className="text-[11px] text-slate-500">Status: {bin.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* GVP Risk Markers */}
        {layers.markers &&
          points.map((gvp) => {
            const level = String(gvp.risk_level || gvp.riskLevel || 'low').toLowerCase()
            const isHigh = level === 'high'

            return (
              <CircleMarker
                key={gvp.id || gvp._id}
                center={[gvp._parsedLat, gvp._parsedLng]}
                radius={isHigh ? 9 : 7}
                pathOptions={{
                  color: RISK_COLOR[level] || RISK_COLOR.low,
                  fillColor: RISK_COLOR[level] || RISK_COLOR.low,
                  fillOpacity: isHigh ? 0.85 : 0.65,
                  weight: isHigh ? 2.5 : 1.5,
                }}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <MapPin size={14} className="text-emerald-600" />
                        {gvp.id || gvp._id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isHigh
                            ? 'bg-red-100 text-red-700'
                            : level === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {level} risk
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <p><strong>Ward:</strong> {gvp.ward || 'Ward 2 - Dwaraka Nagar'}</p>
                      <p><strong>Zone:</strong> {gvp.zone_type || 'Commercial Market'}</p>
                      <p><strong>Distance to Bin:</strong> {gvp.distance_to_bin_m != null ? `${gvp.distance_to_bin_m}m` : '180m'}</p>
                      <p><strong>Recurrence Prob:</strong> <span className="font-mono font-bold text-slate-900">{((gvp.rf_predicted_recurrence_rate || 0.82) * 100).toFixed(1)}%</span></p>
                    </div>

                    {onSelectGVP && (
                      <button
                        type="button"
                        onClick={() => onSelectGVP(gvp)}
                        className="mt-2 w-full flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <ShieldAlert size={13} />
                        Run AI Risk Analysis
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
      </MapContainer>
    </div>
  )
}
