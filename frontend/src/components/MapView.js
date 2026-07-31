import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

const RISK_COLOR = {
  high: '#C1443C',
  medium: '#E8A33D',
  low: '#4C8B63',
}

const DEFAULT_CENTER = [17.7231, 83.3012] // Visakhapatnam (GVMC)

export default function MapView({ gvps = [], height = 360 }) {
  const points = gvps
    .map((g) => {
      const lat = g.lat ?? g.location?.coordinates?.[1]
      const lng = g.lng ?? g.lon ?? g.location?.coordinates?.[0]
      return { ...g, _parsedLat: lat, _parsedLng: lng }
    })
    .filter((g) => g._parsedLat != null && g._parsedLng != null)

  const center = points.length
    ? [points[0]._parsedLat, points[0]._parsedLng]
    : DEFAULT_CENTER

  return (
    <div className="card overflow-hidden p-0" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((gvp) => {
          const level = String(gvp.risk_level || gvp.riskLevel || 'low').toLowerCase()
          return (
            <CircleMarker
              key={gvp.id || gvp._id}
              center={[gvp._parsedLat, gvp._parsedLng]}
              radius={8}
              pathOptions={{
                color: RISK_COLOR[level] || RISK_COLOR.low,
                fillColor: RISK_COLOR[level] || RISK_COLOR.low,
                fillOpacity: 0.65,
                weight: 1.5,
              }}
            >
              <Popup>
                <strong>{gvp.id || gvp._id}</strong>
                <br />
                {gvp.zone_type ? `Zone: ${gvp.zone_type} (${gvp.road_type || 'road'})` : null}
                <br />
                Risk Level: <span className="capitalize">{level}</span>
                <br />
                Ward: {gvp.ward || '—'}
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
