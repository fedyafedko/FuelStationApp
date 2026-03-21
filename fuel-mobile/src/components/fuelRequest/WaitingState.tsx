const STATUS_STEPS = [
    { label: 'Order received',  sub: 'Your request is in the queue'    },
    { label: 'Finding a robot', sub: 'Matching the nearest fuel robot' },
    { label: 'Robot dispatched',sub: 'On the way to your location'     },
  ];
  
  interface Props {
    dots: string;
    onCancel: () => void;
  }
  
  export function WaitingState({ dots, onCancel }: Props) {
    return (
      <div className="fw-waiting">
        <div className="fw-robot-wrap">
          <div className="fw-robot-bg" />
          <div className="fw-robot-icon">🤖</div>
        </div>
  
        <div className="fw-badge fw-badge-orange">
          <span className="fw-badge-dot fw-badge-dot-orange" />
          Searching{dots}
        </div>
  
        <h1 className="fw-waiting-title">Finding your robot</h1>
        <p className="fw-waiting-sub">We're matching the nearest fuel robot<br />to your location. Hang tight!</p>
  
        <div className="fw-steps">
          {STATUS_STEPS.map((step, i) => {
            const s = i === 0 ? 'done' : i === 1 ? 'active' : 'pending';
            return (
              <div className="fw-step" key={i}>
                <div className={`fw-step-icon ${s}`}>
                  {s === 'done'    && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  {s === 'active'  && <div style={{width:10,height:10,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fb923c',animation:'spin 0.8s linear infinite'}} />}
                  {s === 'pending' && <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,0.15)'}} />}
                </div>
                <div className="fw-step-text">
                  <div className={`fw-step-label${s === 'pending' ? ' pending' : ''}`}>{step.label}</div>
                  <div className="fw-step-sub">{step.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
  
        <div className="fw-spinner-wrap">
          <div className="fw-ring" />
          <div className="fw-ring-label">Waiting for confirmation{dots}</div>
        </div>
  
        <button className="fw-do-cancel-btn" onClick={onCancel}>
          Cancel Request
        </button>
      </div>
    );
  }