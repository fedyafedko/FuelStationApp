import type { FuelRequestDTO } from '../../types/api.types';

interface Props {
  fuelRequest: FuelRequestDTO;
  completing: boolean;
  onComplete: () => void;
}

export function FuelingState({ fuelRequest, completing, onComplete }: Props) {
  return (
    <div className="fw-fueling">
      <div className="fw-fueling-anim">
        <div className="fw-fueling-ring" />
        <div className="fw-fueling-ring-spin" />
        <div className="fw-fueling-inner">⛽</div>
      </div>

      <div className="fw-badge fw-badge-green" style={{ background:'rgba(96,165,250,0.1)', borderColor:'rgba(96,165,250,0.25)', color:'#60a5fa' }}>
        <span className="fw-badge-dot" style={{ background:'#60a5fa' }} />
        Fueling Active
      </div>

      <h1 className="fw-fueling-title">Fueling your car</h1>
      <p className="fw-fueling-sub">Your car is being fueled right now. Stay nearby and click Complete when done.</p>

      <div className="fw-fueling-info">
        <div className="fw-fueling-info-icon">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="fw-fueling-info-text">
          <div className="fw-fueling-info-label">Fueling amount</div>
          <div className="fw-fueling-info-val">{fuelRequest.requestedLiters} L</div>
        </div>
      </div>

      <button className="fw-complete-btn" onClick={onComplete} disabled={completing}>
        {completing
          ? <><div className="fw-btn-spinner" /> Completing…</>
          : <>
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Fueling Complete
            </>
        }
      </button>
    </div>
  );
}