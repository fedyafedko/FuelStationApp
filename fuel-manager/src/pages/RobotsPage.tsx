import { useEffect, useRef, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { RobotDTO, CreateRobotDTO, CreateLocationDTO } from '../types/api.types'
import '../manager.css'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { L: any }
}

interface RouteDTO {
  id: string
  fuelRequestId: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  distance: number
  duration: number
  geometry: string
  createdAt: string
}

const ROBOT_STATUS: Record<number, { label: string; cls: string; dot: string }> = {
  0: { label: 'Offline',        cls: 'purple',  dot: '#a78bfa' },
  1: { label: 'Idle',           cls: 'done',    dot: '#34d399' },
  2: { label: 'Busy',           cls: 'active',  dot: '#60a5fa' },
  3: { label: 'Charging',       cls: 'yellow',  dot: '#fbbf24' },
  4: { label: 'Error',          cls: 'failed',  dot: '#f43f5e' },
  5: { label: 'Returning Home', cls: 'pending', dot: '#fb923c' },
}

// ─── Battery icon ─────────────────────────────────────────────────────────────
function BatteryIcon({ level }: { level: number }) {
  const color = level > 50 ? '#34d399' : level > 20 ? '#fbbf24' : '#f43f5e'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 28, height: 13, border: `1.5px solid ${color}`, borderRadius: 3, position: 'relative', padding: 2 }}>
        <div style={{ height: '100%', width: `${level}%`, background: color, borderRadius: 1, transition: 'width 0.3s' }} />
        <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 3, height: 6, background: color, borderRadius: '0 2px 2px 0' }} />
      </div>
      <span style={{ fontSize: 12, color, fontFamily: 'var(--mono)', fontWeight: 600 }}>{level}%</span>
    </div>
  )
}

// ─── Route map ────────────────────────────────────────────────────────────────
type RouteMapProps = {
  route: RouteDTO
  robot: RobotDTO
  onArrived?: () => void
}

function RobotRouteMap({ route, robot, onArrived }: RouteMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef        = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef     = useRef<any>(null)
  const rafRef        = useRef<number | null>(null)
  const mountedRef    = useRef(true)
  const arrivalSentRef = useRef(false)
  const [leafletReady, setLeafletReady] = useState(!!window.L)

  useEffect(() => {
    if (window.L) { setLeafletReady(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletReady || !containerRef.current) return
    mountedRef.current = true

    const L = window.L

    const decodePolyline = (encoded: string): [number, number][] => {
      const coords: [number, number][] = []
      let index = 0, lat = 0, lng = 0
      while (index < encoded.length) {
        let b, shift = 0, result = 0
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
        lat += (result & 1) ? ~(result >> 1) : result >> 1
        shift = 0; result = 0
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
        lng += (result & 1) ? ~(result >> 1) : result >> 1
        coords.push([lat / 1e5, lng / 1e5])
      }
      return coords
    }

    const coords = decodePolyline(route.geometry)
    if (!coords.length) return

    const reversedCoords = [...coords].reverse()

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
      .setView(coords[0], 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.polyline(coords, { color: '#fb923c', weight: 4, opacity: 0.85, dashArray: '8 4' }).addTo(map)

    const startIcon = L.divIcon({
      className: '',
      html: `<div style="width:12px;height:12px;border-radius:50%;background:#60a5fa;border:2.5px solid white;box-shadow:0 2px 8px rgba(96,165,250,0.6);"></div>`,
      iconSize: [12, 12], iconAnchor: [6, 6],
    })
    L.marker(coords[coords.length - 1], { icon: startIcon }).addTo(map)

    const destIcon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#34d399;border:3px solid white;box-shadow:0 2px 12px rgba(52,211,153,0.7);display:flex;align-items:center;justify-content:center;font-size:9px;">🏠</div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    })
    L.marker(coords[0], { icon: destIcon }).addTo(map)

    const robotIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(251,146,60,0.2);animation:robotPulse 1.5s ease-in-out infinite;"></div>
          <div style="position:relative;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#fb923c,#f43f5e);border:2.5px solid white;box-shadow:0 3px 12px rgba(251,146,60,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;z-index:2;">🤖</div>
        </div>`,
      iconSize: [44, 44], iconAnchor: [22, 22],
    })

    const marker = L.marker(coords[coords.length - 1], { icon: robotIcon }).addTo(map)
    markerRef.current = marker
    mapRef.current = map

    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
    setTimeout(() => map.invalidateSize(), 100)

    let segIdx = 0, progress = 0
    const SPEED = 1.008

    const animate = () => {
      if (!mountedRef.current || !markerRef.current) return

      if (segIdx >= reversedCoords.length - 1) {
        markerRef.current.setLatLng(reversedCoords[reversedCoords.length - 1])

        if (!arrivalSentRef.current) {
          arrivalSentRef.current = true
          axiosInstance.put(`/api/robot/arrived?robotId=${robot.id}`)
            .then(() => {
              // Викликаємо onArrived тільки після успішного запиту
              if (mountedRef.current) onArrived?.()
            })
            .catch(err => console.error('Arrival request failed:', err))
        }
        return
      }

      const [lat1, lng1] = reversedCoords[segIdx]
      const [lat2, lng2] = reversedCoords[segIdx + 1]
      markerRef.current.setLatLng([
        lat1 + (lat2 - lat1) * progress,
        lng1 + (lng2 - lng1) * progress,
      ])
      progress += SPEED
      if (progress >= 1) { progress = 0; segIdx++ }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      mountedRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [leafletReady, route])

  return (
    <>
      <style>{`
        @keyframes robotPulse {
          0%,100%{transform:scale(1);opacity:0.7}
          50%{transform:scale(1.6);opacity:0}
        }
      `}</style>
      {!leafletReady && (
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', borderRadius: 10, color: 'var(--text3)', fontSize: 13 }}>
          Loading map…
        </div>
      )}
      <div ref={containerRef} style={{ height: 320, width: '100%', borderRadius: 10, overflow: 'hidden', display: leafletReady ? 'block' : 'none' }} />
    </>
  )
}

// ─── Detail drawer ────────────────────────────────────────────────────────────
function RobotDetailDrawer({
  robot,
  onClose,
  onArrived,
}: {
  robot: RobotDTO
  onClose: () => void
  onArrived: () => void
}) {
  const [route, setRoute]               = useState<RouteDTO | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError]     = useState(false)
  const si = ROBOT_STATUS[robot.status] ?? ROBOT_STATUS[0]

  useEffect(() => {
    if (robot.status !== 5) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRouteLoading(true)
    setRouteError(false)
    axiosInstance.get<RouteDTO>(`/api/robot/route?robotId=${robot.id}`)
      .then(r => setRoute(r.data))
      .catch(() => setRouteError(true))
      .finally(() => setRouteLoading(false))
  }, [robot.id, robot.status])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 440, height: '100vh',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border2)',
        display: 'flex', flexDirection: 'column',
        animation: 'drawerIn 0.25s cubic-bezier(0.22,1,0.36,1)',
        overflowY: 'auto',
      }}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:none}}`}</style>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>{robot.uniqueNumber}</div>
            <span className={`badge ${si.cls}`} style={{ marginTop: 4 }}>
              <span className="badge-dot" style={{ background: si.dot }} />
              {si.label}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Battery</div>
            <BatteryIcon level={robot.batteryLevel ?? 0} />
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tank</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{robot.tankCapacity} <span style={{ fontSize: 11, color: 'var(--text3)' }}>L</span></div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', gridColumn: 'span 2' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Current Location</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
              {robot.currentLocation
                ? `${robot.currentLocation.latitude.toFixed(6)}, ${robot.currentLocation.longitude.toFixed(6)}`
                : '—'}
            </div>
          </div>
        </div>

        {/* Route */}
        <div style={{ padding: '16px 20px', flex: 1 }}>
          {robot.status === 5 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fb923c' }}>●</span> Return Route
              </div>

              {routeLoading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text3)', fontSize: 13, gap: 10 }}>
                  <div className="spinner" style={{ width: 20, height: 20, margin: 0 }} />
                  Loading route…
                </div>
              )}

              {routeError && (
                <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#f43f5e', textAlign: 'center' }}>
                  Failed to load route
                </div>
              )}

              {route && !routeLoading && (
                <>
                  <RobotRouteMap route={route} robot={robot} onArrived={onArrived} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                    <div style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distance</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
                        {(route.distance / 1000).toFixed(2)} <span style={{ fontSize: 11, color: 'var(--text3)' }}>km</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ETA</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
                        {Math.ceil(route.duration / 60)} <span style={{ fontSize: 11, color: 'var(--text3)' }}>min</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {robot.status !== 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text3)', fontSize: 13, gap: 8 }}>
              <div style={{ fontSize: 32 }}>🗺️</div>
              Route tracking available when robot is returning home
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Location map picker ──────────────────────────────────────────────────────
function LocationMapPicker({ value, onChange }: { value: CreateLocationDTO; onChange: (loc: CreateLocationDTO) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const [leafletReady, setLeafletReady] = useState(!!window.L)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.L) { setLeafletReady(true); return }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setLeafletReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return
    const L = window.L
    const lat = value.latitude || 50.4501
    const lng = value.longitude || 30.5234
    const map = L.map(containerRef.current, { zoomControl: true }).setView([lat, lng], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map)
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:34px;background:var(--accent,#fb923c);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>`,
      iconSize: [28, 34], iconAnchor: [14, 34],
    })
    if (value.latitude || value.longitude) {
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markerRef.current.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng()
        onChange({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) })
      })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      const newLoc = { latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) }
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        markerRef.current.on('dragend', (ev: any) => {
          const { lat: dlat, lng: dlng } = ev.target.getLatLng()
          onChange({ latitude: parseFloat(dlat.toFixed(6)), longitude: parseFloat(dlng.toFixed(6)) })
        })
      }
      onChange(newLoc)
    })
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 50)
  }, [leafletReady])

  useEffect(() => {
    if (!mapRef.current || !window.L) return
    const { latitude: lat, longitude: lng } = value
    if (!lat && !lng) return
    if (markerRef.current) markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng], mapRef.current.getZoom())
  }, [value.latitude, value.longitude])

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--border)', position: 'relative' }}>
      {!leafletReady && (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', color: 'var(--text3)', fontSize: 13 }}>Loading map…</div>
      )}
      <div ref={containerRef} style={{ height: 260, display: leafletReady ? 'block' : 'none' }} />
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, borderRadius: 20, padding: '3px 10px', pointerEvents: 'none', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}>
        Click or drag pin to set location
      </div>
    </div>
  )
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM: CreateRobotDTO = {
  uniqueNumber: '',
  tankCapacity: 0,
  currentLocation: { latitude: 0, longitude: 0 },
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function RobotsPage() {
  const [robots,        setRobots]        = useState<RobotDTO[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [editing,       setEditing]       = useState<RobotDTO | null>(null)
  const [form,          setForm]          = useState<CreateRobotDTO>(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [error,         setError]         = useState('')
  const [selectedRobot, setSelectedRobot] = useState<RobotDTO | null>(null)

  const load = () => {
    setLoading(true)
    axiosInstance.get<RobotDTO[]>('/api/robot')
      .then(r => setRobots(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Викликається коли робот доїхав — оновлює список і закриває drawer
  const handleArrived = () => {
    load()
    setSelectedRobot(null)
  }

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true) }

  const openEdit = (robot: RobotDTO) => {
    setEditing(robot)
    setForm({
      uniqueNumber: robot.uniqueNumber,
      tankCapacity: robot.tankCapacity,
      currentLocation: { latitude: robot.currentLocation?.latitude ?? 0, longitude: robot.currentLocation?.longitude ?? 0 },
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.uniqueNumber.trim()) { setError('Unique number is required.'); return }
    if (form.tankCapacity <= 0)    { setError('Tank capacity must be greater than 0.'); return }
    if (!form.currentLocation.latitude || !form.currentLocation.longitude) { setError('Please pick a location on the map.'); return }
    setSaving(true); setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      editing
        ? await axiosInstance.put(`/api/robot?robotId=${editing.id}`, form)
        : await axiosInstance.post('/api/robot', form)
      setShowModal(false)
      load()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this robot? This action cannot be undone.')) return
    setDeleting(id)
    try {
      await axiosInstance.delete(`/api/robot?robotId=${id}`)
      load()
    } catch {
      alert('Failed to delete robot.')
    } finally {
      setDeleting(null)
    }
  }

  const setLocation = (field: keyof CreateLocationDTO, value: string) => {
    const num = parseFloat(value)
    setForm(f => ({ ...f, currentLocation: { ...f.currentLocation, [field]: isNaN(num) ? 0 : num } }))
  }

  const hasLocation = !!(form.currentLocation.latitude || form.currentLocation.longitude)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <div className="page-title">Robots</div>
          <div className="page-sub">{robots.length} robots registered</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Add Robot
        </button>
      </div>

      {loading && <div className="spinner" />}

      {!loading && robots.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <div className="empty-text">No robots registered yet</div>
          <button className="btn btn-primary" onClick={openCreate}>Add your first robot</button>
        </div>
      )}

      {!loading && robots.length > 0 && (
        <div className="robots-grid">
          {robots.map((robot, idx) => {
            const si = ROBOT_STATUS[robot.status] ?? ROBOT_STATUS[0]
            const isReturning = robot.status === 5
            return (
              <div
                className="robot-card animate-in"
                key={robot.id}
                style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer' }}
                onClick={() => setSelectedRobot(robot)}
              >
                <div className="robot-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="robot-avatar" style={isReturning ? { animation: 'robotPulseCard 1.5s ease-in-out infinite' } : {}}>🤖</div>
                    <div>
                      <div className="robot-name" style={{ fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>{robot.uniqueNumber}</div>
                      <div className="robot-id">
                        {robot.currentLocation
                          ? `${robot.currentLocation.latitude.toFixed(4)}, ${robot.currentLocation.longitude.toFixed(4)}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="robot-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(robot)} title="Edit">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(robot.id)} disabled={deleting === robot.id} title="Delete">
                      {deleting === robot.id
                        ? <div style={{ width: 14, height: 14, border: '2px solid rgba(244,63,94,0.3)', borderTopColor: '#f43f5e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${si.cls}`}>
                    <span className="badge-dot" style={{ background: si.dot }} />
                    {si.label}
                  </span>
                  {isReturning && (
                    <span style={{ fontSize: 10, color: '#fb923c', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 19l-7-7 7-7M21 12H3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      View route
                    </span>
                  )}
                </div>

                <BatteryIcon level={robot.batteryLevel ?? 85} />

                <div className="robot-stats">
                  <div>
                    <div className="robot-stat-label">Tank Capacity</div>
                    <div className="robot-stat-value" style={{ color: 'var(--accent)' }}>{robot.tankCapacity} L</div>
                  </div>
                  <div>
                    <div className="robot-stat-label">Location</div>
                    <div className="robot-stat-value" style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
                      {robot.currentLocation
                        ? `${robot.currentLocation.latitude.toFixed(2)}° ${robot.currentLocation.longitude.toFixed(2)}°`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedRobot && (
        <RobotDetailDrawer
          robot={selectedRobot}
          onClose={() => setSelectedRobot(null)}
          onArrived={handleArrived}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth: 520, width: '100%' }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Robot' : 'Add Robot'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group span2">
                <label className="form-label">Unique Number</label>
                <input className="form-input" placeholder="e.g. RBT-001" value={form.uniqueNumber}
                  onChange={e => setForm(f => ({ ...f, uniqueNumber: e.target.value.toUpperCase() }))}
                  style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em' }} />
              </div>
              <div className="form-group span2">
                <label className="form-label">Tank Capacity (L)</label>
                <input className="form-input" type="number" min={0} placeholder="e.g. 50"
                  value={form.tankCapacity === 0 ? '' : form.tankCapacity}
                  onChange={e => setForm(f => ({ ...f, tankCapacity: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Location</label>
              <LocationMapPicker
                value={form.currentLocation}
                onChange={loc => setForm(f => ({ ...f, currentLocation: { latitude: loc.latitude, longitude: loc.longitude } }))}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Latitude</label>
                  <input className="form-input" type="number" step="any" placeholder="50.4501"
                    value={form.currentLocation.latitude || ''}
                    onChange={e => setLocation('latitude', e.target.value)}
                    style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '7px 10px' }} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>Longitude</label>
                  <input className="form-input" type="number" step="any" placeholder="30.5234"
                    value={form.currentLocation.longitude || ''}
                    onChange={e => setLocation('longitude', e.target.value)}
                    style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '7px 10px' }} />
                </div>
              </div>
              {hasLocation && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {form.currentLocation.latitude.toFixed(6)}, {form.currentLocation.longitude.toFixed(6)}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 8, padding: '10px 13px', fontSize: 13, color: '#f43f5e', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                  : editing ? 'Save Changes' : 'Add Robot'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes robotPulseCard {
          0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0.4)}
          50%{box-shadow:0 0 0 8px rgba(251,146,60,0)}
        }
      `}</style>
    </div>
  )
}