import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import type { StatisticsResponse } from '../types/api.types'

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

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [statistics, setStatistics] = useState<StatisticsResponse>()


  useEffect(() => {
    axiosInstance.get<StatisticsResponse>('/api/statistics')
      .then(r => setStatistics(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total     = statistics?.totalRequests
  const active    = statistics?.activeRequests
  const completed = statistics?.completedRequests
  const revenue   = statistics?.totalRevenue

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Real-time operations overview</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/requests')}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
          </svg>
          View All Requests
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value orange">{loading ? '—' : total}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Active Now</div>
          <div className="stat-value blue">{loading ? '—' : active}</div>
          <div className="stat-sub">In queue or in progress</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Completed</div>
          <div className="stat-value green">{loading ? '—' : completed}</div>
          <div className="stat-sub">Successfully fueled</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value yellow">{loading ? '—' : `₴${revenue?.toLocaleString()}`}</div>
          <div className="stat-sub">From completed orders</div>
        </div>
      </div>

      {/* Recent requests */}
      <div className="table-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Recent Requests</div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/requests')}>View all →</button>
        </div>

        {loading && <div className="spinner" />}

        {!loading && statistics?.recentRequests.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⛽</div>
            <div className="empty-text">No requests yet</div>
          </div>
        )}

        {!loading && (statistics?.recentRequests?.length ?? 0) > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Car</th>
                <th>Liters</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {statistics?.recentRequests.map(r => {
                const si = STATUS_INFO[r.status] ?? STATUS_INFO[0]
                return (
                  <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)}>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{r.id.slice(0, 8)}…</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {r.car ? `${r.car.mark} ${r.car.model}` : '—'}
                      </div>
                      {r.car && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{r.car.carNumber}</div>}
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{r.requestedLiters} L</span></td>
                    <td><span style={{ color: 'var(--accent)', fontWeight: 700 }}>₴{r.totalPrice?.toLocaleString()}</span></td>
                    <td>
                      <span className={`badge ${si.cls}`}>
                        <span className="badge-dot" style={{ background: si.dot }} />
                        {si.label}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{fmt(r.createAt)}</span></td>
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