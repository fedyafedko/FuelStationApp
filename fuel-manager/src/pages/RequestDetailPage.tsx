import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { FuelRequestDTO } from '../types/api.types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import polyline from '@mapbox/polyline'
import { fuelRequestApi } from '../api/fuelRequest.api'

const STATUS_INFO: Record<number, { label: string; cls: string; dot: string }> = {
  0: { label: 'Pending',           cls: 'pending', dot: '#fb923c' },
  1: { label: 'Completed',         cls: 'done',    dot: '#34d399' },
  2: { label: 'In Progress',       cls: 'active',  dot: '#60a5fa' },
  3: { label: 'Cancelled',         cls: 'failed',  dot: '#f43f5e' },
  4: { label: 'Robot Unavailable', cls: 'failed',  dot: '#f43f5e' },
  5: { label: 'Waiting Payment',   cls: 'yellow',  dot: '#fbbf24' },
  6: { label: 'Fueling',           cls: 'active',  dot: '#60a5fa' },
  7: { label: 'Car Sent',          cls: 'purple',  dot: '#a78bfa' },
}

const FUEL_TYPE: Record<number, string> = { 0: 'Petrol', 1: 'Diesel', 2: 'Gas' }

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
function fmtDist(m: number) { return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m` }
function fmtDur(s: number) {
  const m = Math.floor(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}

// Route map component
function RouteMap({ geometry, startLat, startLng, endLat, endLng }: {
  geometry: string; startLat: number; startLng: number; endLat: number; endLng: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Route line
    const coords: [number, number][] = polyline.decode(geometry)
    const line = L.polyline(coords, { color: '#fb923c', weight: 4, opacity: 0.9 }).addTo(map)

    // Start marker (robot home / depot)
    L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#34d399;border:3px solid #fff;box-shadow:0 2px 8px rgba(52,211,153,0.6)"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    })
    L.marker([startLat, startLng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#34d399;border:3px solid #fff;box-shadow:0 2px 8px rgba(52,211,153,0.6)"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      })
    }).addTo(map).bindPopup('<b>Robot Start</b>')

    // End marker (customer)
    L.marker([endLat, endLng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#fb923c;border:3px solid #fff;box-shadow:0 2px 8px rgba(251,146,60,0.6)"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      })
    }).addTo(map).bindPopup('<b>Customer Location</b>')

    map.fitBounds(line.getBounds(), { padding: [32, 32] })
    setTimeout(() => map.invalidateSize(), 100)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [geometry])

  return (
    <>
      <style>{`
        .rm-wrap .leaflet-tile-pane,.rm-wrap .leaflet-overlay-pane,.rm-wrap .leaflet-shadow-pane,
        .rm-wrap .leaflet-marker-pane,.rm-wrap .leaflet-tooltip-pane,.rm-wrap .leaflet-popup-pane { z-index:auto!important; }
        .rm-wrap .leaflet-top,.rm-wrap .leaflet-bottom { z-index:1!important; }
        .leaflet-popup-content-wrapper { background:#0d1117;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#f0f4ff;box-shadow:0 8px 24px rgba(0,0,0,0.4); }
        .leaflet-popup-tip { background:#0d1117; }
      `}</style>
      <div className="rm-wrap" style={{ position:'relative', isolation:'isolate', zIndex:0, borderRadius:9, overflow:'hidden', height:360 }}>
        <div ref={containerRef} style={{ height:'100%', width:'100%' }} />
      </div>
    </>
  )
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [req, setReq]         = useState<FuelRequestDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fuelRequestApi.getById(id ?? '')
      .then(r => setReq(r.data))
      .catch(() => setError('Failed to load request.'))
      .finally(() => setLoading(false))
  }, [id])

  const si = req ? (STATUS_INFO[req.status] ?? STATUS_INFO[0]) : null

  return (
    <div className="animate-in" style={{ padding: '28px 32px' }}>
      <button className="back-btn" onClick={() => navigate('/requests')}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Requests
      </button>

      {loading && <div className="spinner" />}
      {error   && <div className="empty-state"><div className="empty-icon">⚠️</div><div className="empty-text">{error}</div></div>}

      {req && si && (
        <>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                <div className="page-title" style={{ fontSize:22 }}>
                  {req.car ? `${req.car.mark} ${req.car.model}` : 'Fuel Request'}
                </div>
                <span className={`badge ${si.cls}`}>
                  <span className="badge-dot" style={{ background: si.dot }} />
                  {si.label}
                </span>
              </div>
              <div className="page-sub">
                Request <span className="mono">{req.id}</span> · {fmt(req.createAt)}
              </div>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Price</div>
                <div style={{ fontSize:28, fontWeight:800, color:'var(--accent)', letterSpacing:'-0.03em' }}>₴{req.totalPrice?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            {/* Left column */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {req.status != 7 &&
            <>
              {/* Map */}
              {req.route ? (
                <div className="detail-card" style={{ padding:16 }}>
                  <div className="detail-card-title">Robot Route</div>
                  <RouteMap
                    geometry={req.route.geometry}
                    startLat={req.route.startLat}
                    startLng={req.route.startLng}
                    endLat={req.route.endLat}
                    endLng={req.route.endLng}
                  />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:12 }}>
                    {[
                      { label:'Distance', value: fmtDist(req.route.distance) },
                      { label:'Duration', value: fmtDur(req.route.duration) },
                      { label:'Created',  value: fmt(req.route.createdAt).split(',')[0] },
                    ].map(s => (
                      <div key={s.label} style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)' }}>
                        <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{s.label}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--blue)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="detail-card">
                  <div className="detail-card-title">Robot Route</div>
                  <div className="map-placeholder">
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                    </svg>
                    <span>No route data available</span>
                  </div>
                </div>
              )}
              </>
              }
              {req.status === 7 && req.location.latitude && req.location.longitude && (
                <div className="detail-card" style={{ borderColor:'rgba(167,139,250,0.3)' }}>
                  <div className="detail-card-title" style={{ color:'#a78bfa' }}>
                    Delivery Location (Car Sent)
                  </div>
              
                  <div style={{
                    background:'var(--surface2)',
                    padding:'12px 14px',
                    borderRadius:8,
                    border:'1px solid var(--border)',
                    marginBottom:12
                  }}>
                    <div className="info-row">
                      <span className="info-label">Latitude</span>
                      <span className="info-value mono">{req.location.latitude.toFixed(6)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Longitude</span>
                      <span className="info-value mono">{req.location.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${req.location.latitude}, ${req.location.longitude}`)
                    }}
                    style={{
                      background:'#a78bfa',
                      border:'none',
                      padding:'8px 14px',
                      borderRadius:6,
                      color:'#0b0f19',
                      fontWeight:600,
                      cursor:'pointer'
                    }}
                  >
                    Copy Coordinates
                  </button>
                  
                  <a
                    href={`https://www.google.com/maps?q=${req.location.latitude},${req.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display:'inline-block',
                      marginLeft:10,
                      color:'#60a5fa',
                      fontWeight:600,
                      textDecoration:'none'
                    }}
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
              {/* Cancellation reason */}
              {req.status === 3 && req.cancelReason && (
                <div className="detail-card" style={{ background:'rgba(244,63,94,0.04)', borderColor:'rgba(244,63,94,0.18)' }}>
                  <div className="detail-card-title" style={{ color:'#f43f5e' }}>Cancellation Reason</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>{req.cancelReason}</div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Order info */}
              <div className="detail-card">
                <div className="detail-card-title">Order Details</div>
                {[
                  { label: 'Requested Liters', value: `${req.requestedLiters} L` },
                  { label: 'Total Price',       value: `₴${req.totalPrice?.toLocaleString()}` },
                  { label: 'Status',            value: si.label },
                  { label: 'Created At',        value: fmt(req.createAt) },
                ].map(row => (
                  <div className="info-row" key={row.label}>
                    <span className="info-label">{row.label}</span>
                    <span className="info-value">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Vehicle info */}
              {req.car && (
                <div className="detail-card">
                  <div className="detail-card-title">Vehicle</div>
                  {[
                    { label: 'Make & Model',    value: `${req.car.mark} ${req.car.model}` },
                    { label: 'Plate',           value: req.car.carNumber, mono: true },
                    { label: 'Engine',          value: `${req.car.engineCapacity} L` },
                    { label: 'Tank Capacity',   value: `${req.car.tankCapacity} L` },
                    { label: 'Fuel Type',       value: FUEL_TYPE[req.car.fuelType] ?? 'Unknown' },
                  ].map(row => (
                    <div className="info-row" key={row.label}>
                      <span className="info-label">{row.label}</span>
                      <span className={`info-value ${row.mono ? 'mono' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Route coords */}
              {req.route && (
                <div className="detail-card">
                  <div className="detail-card-title">Coordinates</div>
                  {[
                    { label: 'Start Lat', value: req.route.startLat.toFixed(5) },
                    { label: 'Start Lng', value: req.route.startLng.toFixed(5) },
                    { label: 'End Lat',   value: req.route.endLat.toFixed(5) },
                    { label: 'End Lng',   value: req.route.endLng.toFixed(5) },
                  ].map(row => (
                    <div className="info-row" key={row.label}>
                      <span className="info-label">{row.label}</span>
                      <span className="info-value mono" style={{ fontSize:12 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}