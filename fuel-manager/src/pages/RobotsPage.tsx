import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

interface RobotDTO {
  id: string
  name: string
  serialNumber: string
  status: number        // 0=Idle, 1=InTransit, 2=Charging, 3=Maintenance
  batteryLevel: number  // 0–100
  totalDeliveries: number
  createdAt: string
}

interface CreateRobotDTO {
  name: string
  serialNumber: string
}

const ROBOT_STATUS: Record<number, { label: string; cls: string; dot: string }> = {
  0: { label: 'Idle',        cls: 'done',    dot: '#34d399' },
  1: { label: 'In Transit',  cls: 'active',  dot: '#60a5fa' },
  2: { label: 'Charging',    cls: 'yellow',  dot: '#fbbf24' },
  3: { label: 'Maintenance', cls: 'failed',  dot: '#f43f5e' },
}

function BatteryIcon({ level }: { level: number }) {
  const color = level > 50 ? '#34d399' : level > 20 ? '#fbbf24' : '#f43f5e'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:28, height:13, border:`1.5px solid ${color}`, borderRadius:3, position:'relative', padding:2 }}>
        <div style={{ height:'100%', width:`${level}%`, background:color, borderRadius:1, transition:'width 0.3s' }} />
        <div style={{ position:'absolute', right:-5, top:'50%', transform:'translateY(-50%)', width:3, height:6, background:color, borderRadius:'0 2px 2px 0' }} />
      </div>
      <span style={{ fontSize:12, color, fontFamily:'var(--mono)', fontWeight:600 }}>{level}%</span>
    </div>
  )
}

const EMPTY_FORM: CreateRobotDTO = { name: '', serialNumber: '' }

export function RobotsPage() {
  const [robots,  setRobots]  = useState<RobotDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState<RobotDTO | null>(null)
  const [form,      setForm]      = useState<CreateRobotDTO>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [error,     setError]     = useState('')

  const load = () => {
    setLoading(true)
    axiosInstance.get<RobotDTO[]>('/api/robot')
      .then(r => setRobots(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  const openEdit = (robot: RobotDTO) => {
    setEditing(robot)
    setForm({ name: robot.name, serialNumber: robot.serialNumber })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.serialNumber.trim()) {
      setError('Name and Serial Number are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await axiosInstance.put(`/api/robot/${editing.id}`, form)
      } else {
        await axiosInstance.post('/api/robot', form)
      }
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
      await axiosInstance.delete(`/api/robot/${id}`)
      load()
    } catch {
      alert('Failed to delete robot.')
    } finally {
      setDeleting(null)
    }
  }

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
        <div className="empty-state" style={{ margin:'0 32px' }}>
          <div className="empty-icon">🤖</div>
          <div className="empty-text">No robots registered yet</div>
          <button className="btn btn-primary" onClick={openCreate}>Add your first robot</button>
        </div>
      )}

      {!loading && robots.length > 0 && (
        <div className="robots-grid">
          {robots.map((robot, idx) => {
            const si = ROBOT_STATUS[robot.status] ?? ROBOT_STATUS[0]
            return (
              <div className="robot-card animate-in" key={robot.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="robot-card-header">
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div className="robot-avatar">🤖</div>
                    <div>
                      <div className="robot-name">{robot.name}</div>
                      <div className="robot-id">{robot.serialNumber}</div>
                    </div>
                  </div>
                  <div className="robot-actions">
                    <button
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => openEdit(robot)}
                      title="Edit"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={() => handleDelete(robot.id)}
                      disabled={deleting === robot.id}
                      title="Delete"
                    >
                      {deleting === robot.id
                        ? <div style={{ width:14, height:14, border:'2px solid rgba(244,63,94,0.3)', borderTopColor:'#f43f5e', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                        : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                      }
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom:12 }}>
                  <span className={`badge ${si.cls}`}>
                    <span className="badge-dot" style={{ background: si.dot }} />
                    {si.label}
                  </span>
                </div>

                <BatteryIcon level={robot.batteryLevel ?? 85} />

                <div className="robot-stats">
                  <div>
                    <div className="robot-stat-label">Deliveries</div>
                    <div className="robot-stat-value" style={{ color:'var(--accent)' }}>
                      {robot.totalDeliveries ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="robot-stat-label">Registered</div>
                    <div className="robot-stat-value" style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text3)' }}>
                      {robot.createdAt ? new Date(robot.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Robot' : 'Add Robot'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="form-grid" style={{ marginBottom:20 }}>
              <div className="form-group span2">
                <label className="form-label">Robot Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Robot Alpha-7"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group span2">
                <label className="form-label">Serial Number</label>
                <input
                  className="form-input mono"
                  placeholder="e.g. FS-RB-001"
                  value={form.serialNumber}
                  onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value.toUpperCase() }))}
                  style={{ fontFamily:'var(--mono)', letterSpacing:'0.05em' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', borderRadius:8, padding:'10px 13px', fontSize:13, color:'#f43f5e', marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {error}
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> Saving…</>
                  : editing ? 'Save Changes' : 'Add Robot'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}