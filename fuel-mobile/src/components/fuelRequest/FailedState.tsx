import type { FuelRequestDTO } from '../../types/api.types';

interface Props {
  fuelRequest: FuelRequestDTO;
  confirming: boolean;
  onSendCar: () => void;
}

export function FailedState({ fuelRequest, confirming, onSendCar }: Props) {
  return (
    <div className="fw-failed">
      <div className="fw-fail-icon-wrap">
        <div className="fw-fail-ring" />
        <div className="fw-fail-ring-2" />
        <div className="fw-fail-inner">😔</div>
      </div>

      <div className="fw-badge" style={{ background:'rgba(244,63,94,0.1)', borderColor:'rgba(244,63,94,0.25)', color:'#f43f5e' }}>
        <span className="fw-badge-dot" style={{ background:'#f43f5e' }} />
        Delivery failed
      </div>

      <h1 className="fw-fail-title">Robot couldn't arrive</h1>
      <p className="fw-fail-sub">The fuel robot was unable to reach your location. We can send a car with fuel instead — same amount, no extra charge.</p>

      <div className="fw-fail-info-card">
        <div className="fw-fail-info-row">
          <div className="fw-fail-info-icon">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <div className="fw-fail-info-label">Original order</div>
            <div className="fw-fail-info-value">{fuelRequest.requestedLiters ?? '—'} L of fuel</div>
          </div>
        </div>
        <div className="fw-fail-info-row">
          <div className="fw-fail-info-icon">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" /><circle cx="7.5" cy="16" r="1.2" fill="currentColor" stroke="none" /><circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" /></svg>
          </div>
          <div>
            <div className="fw-fail-info-label">Alternative</div>
            <div className="fw-fail-info-value">Fuel delivery by car</div>
          </div>
        </div>
        <div className="fw-fail-info-row">
          <div className="fw-fail-info-icon">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="fw-fail-info-label">Extra cost</div>
            <div className="fw-fail-info-value" style={{ color:'#22c55e' }}>None — same price</div>
          </div>
        </div>
      </div>

      <button className="fw-send-car-btn" onClick={onSendCar} disabled={confirming}>
        {confirming
          ? <><div className="fw-btn-spinner" /> Sending car…</>
          : <>
              <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" /><circle cx="7.5" cy="16" r="1.2" fill="white" stroke="none" /><circle cx="16.5" cy="16" r="1.2" fill="white" stroke="none" /></svg>
              </div>
              Send a Car with Fuel
            </>
        }
      </button>
      <button className="fw-cancel-btn" onClick={() => window.location.href = '/'}>Cancel & Go Home</button>
    </div>
  );
}