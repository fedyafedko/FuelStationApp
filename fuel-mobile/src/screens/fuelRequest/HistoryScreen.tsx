import { useEffect, useState } from 'react';
import type { FuelRequestDTO } from '../../types/api.types';
import { fuelRequestApi } from '../../api/fuelRequest.api';

const STATUS_MAP: Record<number, { label: string; color: string; bg: string; dot: string }> = {
  1: { label: 'Completed',        color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    dot: '#22c55e' },
  3: { label: 'Cancelled',        color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',    dot: '#f43f5e' },
  7: { label: 'Car Sent',         color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  dot: '#a78bfa' },
};

const FUEL_TYPE: Record<number, { label: string; color: string }> = {
  0: { label: 'Petrol', color: '#fb923c' },
  1: { label: 'Diesel', color: '#facc15' },
  2: { label: 'Gas',    color: '#4ade80' },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', { day:'2-digit', month:'short', year:'numeric' })
    + ' · ' + d.toLocaleTimeString('uk-UA', { hour:'2-digit', minute:'2-digit' });
}

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}m`;
}

const statusInfo = (s: number) => STATUS_MAP[s] ?? { label: 'Unknown', color: '#888', bg: 'rgba(136,136,136,0.1)', dot: '#888' };

export default function HistoryScreen() {
  const [requests, setRequests]   = useState<FuelRequestDTO[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState('');
  const [selected, setSelected]   = useState<FuelRequestDTO | null>(null);
  const [filter,   setFilter]     = useState<'all' | 'completed' | 'cancelled' | 'other'>('all');

  useEffect(() => {
    fuelRequestApi.history()
      .then(r => setRequests(r.data))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    if (filter === 'completed') return r.status === 1;
    if (filter === 'cancelled') return r.status === 3;
    if (filter === 'other')     return ![1, 3].includes(r.status);
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box;margin:0;padding:0; }

        .hs-root { font-family:'Sora',sans-serif;min-height:100dvh;background:#09090f;color:#fff;display:flex;flex-direction:column;position:relative;overflow:hidden; }

        /* orbs */
        .hs-orb { position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0; }
        .hs-orb-1 { width:340px;height:340px;background:radial-gradient(circle,rgba(251,146,60,0.10) 0%,transparent 70%);top:-80px;right:-60px;animation:hsDrift1 10s ease-in-out infinite alternate; }
        .hs-orb-2 { width:260px;height:260px;background:radial-gradient(circle,rgba(96,165,250,0.08) 0%,transparent 70%);bottom:60px;left:-40px;animation:hsDrift2 13s ease-in-out infinite alternate; }
        @keyframes hsDrift1 { from{transform:translate(0,0)} to{transform:translate(24px,36px)} }
        @keyframes hsDrift2 { from{transform:translate(0,0)} to{transform:translate(-18px,24px)} }

        /* header */
        .hs-header { position:relative;z-index:10;display:flex;align-items:center;gap:12px;padding:14px 20px;background:rgba(9,9,15,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06); }
        .hs-back { width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent;flex-shrink:0; }
        .hs-back:hover { background:rgba(255,255,255,0.09);color:#fff; }
        .hs-header-text { flex:1; }
        .hs-header-title { font-size:17px;font-weight:700;letter-spacing:-0.02em; }
        .hs-header-sub { font-size:12px;color:rgba(255,255,255,0.35);margin-top:1px;font-family:'DM Mono',monospace; }
        .hs-count-badge { background:rgba(251,146,60,0.12);border:1px solid rgba(251,146,60,0.25);border-radius:100px;padding:4px 10px;font-size:11px;font-weight:700;color:#fb923c;font-family:'DM Mono',monospace; }

        /* filter tabs */
        .hs-filters { position:relative;z-index:5;display:flex;gap:8px;padding:14px 20px 0;overflow-x:auto;scrollbar-width:none; }
        .hs-filters::-webkit-scrollbar { display:none; }
        .hs-filter-btn { padding:7px 14px;border-radius:100px;font-size:12px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer;transition:all 0.2s;white-space:nowrap;-webkit-tap-highlight-color:transparent; }
        .hs-filter-btn.active { background:linear-gradient(135deg,#fb923c,#f43f5e);border:none;color:#fff;box-shadow:0 4px 16px rgba(251,146,60,0.3); }
        .hs-filter-btn.inactive { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.45); }
        .hs-filter-btn.inactive:hover { background:rgba(255,255,255,0.08);color:#fff; }

        /* list */
        .hs-body { flex:1;position:relative;z-index:1;overflow-y:auto;padding:16px 20px 40px; }
        .hs-body::-webkit-scrollbar { width:0; }

        @keyframes hsSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }

        .hs-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:80px 24px;text-align:center; }
        .hs-empty-icon { width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:center;font-size:28px; }
        .hs-empty-text { font-size:15px;color:rgba(255,255,255,0.35); }

        /* skeleton */
        .hs-skeleton { border-radius:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);padding:18px;margin-bottom:10px;animation:hsSkeleton 1.4s ease-in-out infinite; }
        @keyframes hsSkeleton { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .hs-skel-line { height:12px;border-radius:6px;background:rgba(255,255,255,0.07);margin-bottom:8px; }

        /* card */
        .hs-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:16px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent;animation:hsSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .hs-card:hover { background:rgba(255,255,255,0.055);border-color:rgba(255,255,255,0.12);transform:translateY(-1px); }
        .hs-card:active { transform:scale(0.99); }

        .hs-card-top { display:flex;align-items:flex-start;gap:12px; }
        .hs-card-icon { width:42px;height:42px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px; }
        .hs-card-main { flex:1;min-width:0; }
        .hs-card-row1 { display:flex;align-items:center;gap:8px;margin-bottom:4px; }
        .hs-card-car { font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .hs-card-plate { font-size:10px;font-weight:600;font-family:'DM Mono',monospace;padding:2px 7px;border-radius:5px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);flex-shrink:0; }
        .hs-card-row2 { display:flex;align-items:center;gap:10px; }
        .hs-card-date { font-size:11px;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace; }
        .hs-status-pill { display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:100px;font-size:10px;font-weight:600;font-family:'DM Mono',monospace;letter-spacing:0.05em; }
        .hs-status-dot { width:5px;height:5px;border-radius:50%; }

        .hs-card-bottom { display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05); }
        .hs-card-meta { display:flex;gap:16px; }
        .hs-meta-item { display:flex;flex-direction:column;gap:2px; }
        .hs-meta-label { font-size:9px;color:rgba(255,255,255,0.25);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em; }
        .hs-meta-value { font-size:13px;font-weight:700;color:#fff; }
        .hs-meta-value.orange { background:linear-gradient(135deg,#fb923c,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .hs-card-arrow { width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);flex-shrink:0; }

        /* ── DRAWER ── */
        .hs-drawer-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:hsFadeIn 0.2s ease; }
        @keyframes hsFadeIn { from{opacity:0} to{opacity:1} }
        .hs-drawer { width:100%;max-width:520px;background:#0e0e18;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;max-height:90dvh;overflow-y:auto;scrollbar-width:none;animation:hsSheetUp 0.32s cubic-bezier(0.22,1,0.36,1); }
        .hs-drawer::-webkit-scrollbar { display:none; }
        @keyframes hsSheetUp { from{transform:translateY(50px);opacity:0} to{transform:none;opacity:1} }

        .hs-drawer-handle { width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,0.1);margin:16px auto 0; }

        /* drawer hero */
        .hs-drawer-hero { padding:20px 24px 0; }
        .hs-drawer-hero-top { display:flex;align-items:center;gap:14px;margin-bottom:20px; }
        .hs-drawer-hero-icon { width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0; }
        .hs-drawer-hero-text { flex:1; }
        .hs-drawer-hero-title { font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#fff; }
        .hs-drawer-hero-sub { font-size:12px;color:rgba(255,255,255,0.4);margin-top:3px;font-family:'DM Mono',monospace; }
        .hs-drawer-close { width:36px;height:36px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);cursor:pointer;transition:all 0.2s;flex-shrink:0; }
        .hs-drawer-close:hover { background:rgba(255,255,255,0.09);color:#fff; }

        /* drawer section */
        .hs-section { padding:0 24px;margin-bottom:20px; }
        .hs-section-title { font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.25);font-family:'DM Mono',monospace;margin-bottom:10px; }
        .hs-info-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden; }
        .hs-info-row { display:flex;align-items:center;gap:14px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.05); }
        .hs-info-row:last-child { border-bottom:none; }
        .hs-info-icon { width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .hs-info-label { font-size:10px;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.05em; }
        .hs-info-value { font-size:13px;font-weight:600;color:#fff;margin-top:2px; }
        .hs-info-value.mono { font-family:'DM Mono',monospace;letter-spacing:0.06em; }

        /* stats row */
        .hs-stats-row { display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px;padding:0 24px; }
        .hs-stat-card { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 12px;text-align:center; }
        .hs-stat-label { font-size:9px;color:rgba(255,255,255,0.25);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px; }
        .hs-stat-value { font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#fff; }
        .hs-stat-value.grad { background:linear-gradient(135deg,#fb923c,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .hs-stat-unit { font-size:10px;color:rgba(255,255,255,0.3);margin-top:1px;font-family:'DM Mono',monospace; }

        /* cancel reason */
        .hs-cancel-card { margin:0 24px 20px;background:rgba(244,63,94,0.06);border:1px solid rgba(244,63,94,0.18);border-radius:16px;padding:16px; }
        .hs-cancel-header { display:flex;align-items:center;gap:10px;margin-bottom:8px; }
        .hs-cancel-icon { width:28px;height:28px;border-radius:8px;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.2);display:flex;align-items:center;justify-content:center; }
        .hs-cancel-title { font-size:11px;font-weight:600;color:#f43f5e;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Mono',monospace; }
        .hs-cancel-reason { font-size:14px;color:rgba(255,255,255,0.65);line-height:1.5; }

        /* route info */
        .hs-route-card { margin:0 24px 20px;background:rgba(96,165,250,0.05);border:1px solid rgba(96,165,250,0.15);border-radius:16px;padding:16px; }
        .hs-route-header { display:flex;align-items:center;gap:10px;margin-bottom:14px; }
        .hs-route-icon { width:28px;height:28px;border-radius:8px;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.2);display:flex;align-items:center;justify-content:center;color:#60a5fa; }
        .hs-route-title { font-size:11px;font-weight:600;color:#60a5fa;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Mono',monospace; }
        .hs-route-stats { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        .hs-route-stat { background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.1);border-radius:10px;padding:10px 12px; }
        .hs-route-stat-label { font-size:9px;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px; }
        .hs-route-stat-value { font-size:16px;font-weight:700;color:#60a5fa; }

        /* drawer bottom padding */
        .hs-drawer-bottom { height:32px; }

        @keyframes spin { to{transform:rotate(360deg)} }
        .hs-spinner { width:36px;height:36px;border-radius:50%;border:3px solid rgba(255,255,255,0.07);border-top-color:#fb923c;animation:spin 0.9s linear infinite;margin:60px auto; }
      `}</style>

      <div className="hs-root">
        <div className="hs-orb hs-orb-1" />
        <div className="hs-orb hs-orb-2" />

        <header className="hs-header">
          <button className="hs-back" onClick={() => window.history.back()}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="hs-header-text">
            <div className="hs-header-title">Fuel History</div>
            <div className="hs-header-sub">{requests.length} requests total</div>
          </div>
          {requests.length > 0 && (
            <span className="hs-count-badge">{requests.length}</span>
          )}
        </header>

        <div className="hs-filters">
          {(['all','completed','cancelled','other'] as const).map(f => (
            <button
              key={f}
              className={`hs-filter-btn ${filter === f ? 'active' : 'inactive'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'completed' ? '✓ Completed' : f === 'cancelled' ? '✕ Cancelled' : 'Other'}
            </button>
          ))}
        </div>

        <div className="hs-body">
          {loading && (
            <>
              {[0,1,2,3].map(i => (
                <div className="hs-skeleton" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="hs-skel-line" style={{ width:'60%' }} />
                  <div className="hs-skel-line" style={{ width:'40%' }} />
                  <div className="hs-skel-line" style={{ width:'80%', marginBottom:0 }} />
                </div>
              ))}
            </>
          )}

          {!loading && error && (
            <div className="hs-empty">
              <div className="hs-empty-icon">⚠️</div>
              <div className="hs-empty-text">{error}</div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="hs-empty">
              <div className="hs-empty-icon">⛽</div>
              <div className="hs-empty-text">No requests found</div>
            </div>
          )}

          {!loading && filtered.map((req, idx) => {
            const si   = statusInfo(req.status);
            const fuel = FUEL_TYPE[req.car?.fuelType ?? 0];
            const icon = req.status === 1 ? '✅' : req.status === 3 ? '❌' : req.status === 4 ? '😔' : '⛽';
            return (
              <div
                key={req.id}
                className="hs-card"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => setSelected(req)}
              >
                <div className="hs-card-top">
                  <div
                    className="hs-card-icon"
                    style={{ background: si.bg, border: `1px solid ${si.color}30` }}
                  >
                    {icon}
                  </div>
                  <div className="hs-card-main">
                    <div className="hs-card-row1">
                      <span className="hs-card-car">
                        {req.car ? `${req.car.mark} ${req.car.model}` : 'Unknown car'}
                      </span>
                      {req.car && (
                        <span className="hs-card-plate">{req.car.carNumber}</span>
                      )}
                    </div>
                    <div className="hs-card-row2">
                      <span className="hs-card-date">{fmt(req.createAt)}</span>
                      <span
                        className="hs-status-pill"
                        style={{ background: si.bg, border: `1px solid ${si.color}40`, color: si.color }}
                      >
                        <span className="hs-status-dot" style={{ background: si.dot }} />
                        {si.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hs-card-bottom">
                  <div className="hs-card-meta">
                    <div className="hs-meta-item">
                      <span className="hs-meta-label">Liters</span>
                      <span className="hs-meta-value">{req.requestedLiters} L</span>
                    </div>
                    <div className="hs-meta-item">
                      <span className="hs-meta-label">Total</span>
                      <span className="hs-meta-value orange">₴{req.totalPrice?.toLocaleString()}</span>
                    </div>
                    {req.car && (
                      <div className="hs-meta-item">
                        <span className="hs-meta-label">Fuel</span>
                        <span className="hs-meta-value" style={{ color: fuel.color }}>{fuel.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="hs-card-arrow">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="hs-drawer-overlay"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="hs-drawer">
            <div className="hs-drawer-handle" />

            <div className="hs-drawer-hero">
              <div className="hs-drawer-hero-top">
                <div
                  className="hs-drawer-hero-icon"
                  style={{
                    background: statusInfo(selected.status).bg,
                    border: `1px solid ${statusInfo(selected.status).color}40`,
                  }}
                >
                  {selected.status === 1 ? '✅' : selected.status === 3 ? '❌' : selected.status === 4 ? '😔' : '⛽'}
                </div>
                <div className="hs-drawer-hero-text">
                  <div className="hs-drawer-hero-title">
                    {selected.car ? `${selected.car.mark} ${selected.car.model}` : 'Fuel Request'}
                  </div>
                  <div className="hs-drawer-hero-sub">{fmt(selected.createAt)}</div>
                </div>
                <button className="hs-drawer-close" onClick={() => setSelected(null)}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="hs-stats-row">
              <div className="hs-stat-card">
                <div className="hs-stat-label">Liters</div>
                <div className="hs-stat-value">{selected.requestedLiters}</div>
                <div className="hs-stat-unit">L</div>
              </div>
              <div className="hs-stat-card">
                <div className="hs-stat-label">Total</div>
                <div className="hs-stat-value grad">₴{selected.totalPrice?.toLocaleString()}</div>
                <div className="hs-stat-unit">UAH</div>
              </div>
              <div className="hs-stat-card">
                <div className="hs-stat-label">Status</div>
                <div
                  className="hs-stat-value"
                  style={{
                    fontSize: 12,
                    color: statusInfo(selected.status).color,
                    WebkitTextFillColor: statusInfo(selected.status).color,
                    background: 'none',
                  }}
                >
                  {statusInfo(selected.status).label}
                </div>
                <div className="hs-stat-unit">&nbsp;</div>
              </div>
            </div>

            {selected.car && (
              <div className="hs-section">
                <div className="hs-section-title">Vehicle</div>
                <div className="hs-info-card">
                  <div className="hs-info-row">
                    <div className="hs-info-icon" style={{ background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.2)' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fb923c" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                        <circle cx="7.5" cy="16" r="1.2" fill="#fb923c" stroke="none" />
                        <circle cx="16.5" cy="16" r="1.2" fill="#fb923c" stroke="none" />
                      </svg>
                    </div>
                    <div>
                      <div className="hs-info-label">Car</div>
                      <div className="hs-info-value">{selected.car.mark} {selected.car.model}</div>
                    </div>
                  </div>
                  <div className="hs-info-row">
                    <div className="hs-info-icon" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <div>
                      <div className="hs-info-label">Plate</div>
                      <div className="hs-info-value mono">{selected.car.carNumber}</div>
                    </div>
                  </div>
                  <div className="hs-info-row">
                    <div className="hs-info-icon" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="hs-info-label">Engine</div>
                      <div className="hs-info-value">{selected.car.engineCapacity} L</div>
                    </div>
                  </div>
                  <div className="hs-info-row">
                    <div
                      className="hs-info-icon"
                      style={{
                        background: `${FUEL_TYPE[selected.car.fuelType]?.color}18`,
                        border: `1px solid ${FUEL_TYPE[selected.car.fuelType]?.color}30`,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={FUEL_TYPE[selected.car.fuelType]?.color ?? '#fff'}>
                        <path d="M18.92 6.01L18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
                        <circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/>
                      </svg>
                    </div>
                    <div>
                      <div className="hs-info-label">Fuel type</div>
                      <div className="hs-info-value" style={{ color: FUEL_TYPE[selected.car.fuelType]?.color }}>
                        {FUEL_TYPE[selected.car.fuelType]?.label}
                      </div>
                    </div>
                  </div>
                  <div className="hs-info-row">
                    <div className="hs-info-icon" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.14-3.36 7.5-7.5 7.5S4.5 16.14 4.5 12 7.86 4.5 12 4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 4.5h4v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 4.5L12 12.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="hs-info-label">Tank capacity</div>
                      <div className="hs-info-value">{selected.car.tankCapacity} L</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selected.status === 3 && selected.cancelReason && (
              <div className="hs-cancel-card">
                <div className="hs-cancel-header">
                  <div className="hs-cancel-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="hs-cancel-title">Cancellation reason</span>
                </div>
                <div className="hs-cancel-reason">{selected.cancelReason}</div>
              </div>
            )}

            {selected.route && (
              <div className="hs-route-card">
                <div className="hs-route-header">
                  <div className="hs-route-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <span className="hs-route-title">Route info</span>
                </div>
                <div className="hs-route-stats">
                  <div className="hs-route-stat">
                    <div className="hs-route-stat-label">Distance</div>
                    <div className="hs-route-stat-value">{fmtDist(selected.route.distance)}</div>
                  </div>
                  <div className="hs-route-stat">
                    <div className="hs-route-stat-label">Duration</div>
                    <div className="hs-route-stat-value">{fmtDur(selected.route.duration)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="hs-drawer-bottom" />
          </div>
        </div>
      )}
    </>
  );
}