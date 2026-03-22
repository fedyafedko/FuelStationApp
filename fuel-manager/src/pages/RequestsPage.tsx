import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FuelRequestDTO } from '../types/api.types'
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

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: '🔵 Active' },
  { key: 'pending',   label: '🟠 Pending' },
  { key: 'completed', label: '✅ Completed' },
  { key: 'cancelled', label: '❌ Cancelled' },
] as const

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function RequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<FuelRequestDTO[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<string>('all')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    fuelRequestApi.getAll()
      .then(r => setRequests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = requests.filter(r => {
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'active'    ? [2, 5, 6].includes(r.status) :
      filter === 'pending'   ? r.status === 0 :
      filter === 'completed' ? r.status === 1 :
      filter === 'cancelled' ? [3, 4].includes(r.status) : true

    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.id.toLowerCase().includes(q) ||
      r.car?.mark?.toLowerCase().includes(q) ||
      r.car?.model?.toLowerCase().includes(q) ||
      r.car?.carNumber?.toLowerCase().includes(q)

    return matchFilter && matchSearch
  })

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <div className="page-title">Fuel Requests</div>
          <div className="page-sub">{requests.length} total · {filtered.length} shown</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search-box">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search by ID, car, plate…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="spinner" />}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No requests match your filters</div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Car</th>
                <th>Plate</th>
                <th>Liters</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Route</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const si = STATUS_INFO[r.status] ?? STATUS_INFO[0]
                return (
                  <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)}>
                    <td>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {r.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {r.car ? `${r.car.mark} ${r.car.model}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>
                        {r.car?.carNumber ?? '—'}
                      </span>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{r.requestedLiters} L</span></td>
                    <td><span style={{ color: 'var(--accent)', fontWeight: 700 }}>₴{r.totalPrice?.toLocaleString()}</span></td>
                    <td>
                      <span className={`badge ${si.cls}`}>
                        <span className="badge-dot" style={{ background: si.dot }} />
                        {si.label}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt(r.createAt)}</span>
                    </td>
                    <td>
                      {r.route
                        ? <span className="badge done"><span className="badge-dot" style={{ background: '#34d399' }} />Available</span>
                        : <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                      }
                    </td>
                    <td>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text3)" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}