import RobotRouteMap from '../RobotRouteMap';
import type { FuelRequestDTO } from '../../types/api.types';

interface Props {
  fuelRequest: FuelRequestDTO;
  onPositionChange: (lat: number, lng: number, isFinished: boolean) => void;
}

export function InProgressState({ fuelRequest, onPositionChange }: Props) {
  return (
    <div className="fw-inprogress">
      <div className="fw-status-bar green">
        <div className="fw-status-icon green">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="fw-status-text">
          <div className="fw-status-title">Robot dispatched 🤖</div>
          <div className="fw-status-sub">Animating route — will detect arrival automatically</div>
        </div>
      </div>

      {fuelRequest.route?.geometry ? (
        <div className="fw-map-wrap">
          <RobotRouteMap
            encodedPolyline={fuelRequest.route.geometry}
            speed={2}
            height="100%"
            onPositionChange={onPositionChange}
          />
        </div>
      ) : (
        <div style={{ margin:'12px 16px 0', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'32px 20px', textAlign:'center' }}>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)' }}>Route is being calculated…</div>
        </div>
      )}
    </div>
  );
}