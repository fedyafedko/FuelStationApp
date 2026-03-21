interface Props {
    confirmed: boolean;
  }
  
  export function CompletedState({ confirmed }: Props) {
    return (
      <div className="fw-done">
        <div className="fw-done-icon-wrap">
          <div className="fw-done-bg" />
          <div className="fw-done-emoji">{confirmed ? '🚗' : '✅'}</div>
        </div>
  
        <div className="fw-badge fw-badge-green" style={{ marginBottom:16 }}>
          <span className="fw-badge-dot fw-badge-dot-green" />
          {confirmed ? 'Car dispatched' : 'All done'}
        </div>
  
        <h1 className="fw-waiting-title" style={{ marginBottom:10 }}>
          {confirmed ? 'Car is on the way!' : 'Fueling complete!'}
        </h1>
  
        <p className="fw-waiting-sub">
          {confirmed
            ? 'A driver has been assigned and is heading to your location with fuel.'
            : 'Your car has been successfully refueled. Have a great journey! 🚀'
          }
        </p>
  
        <button
          onClick={() => window.location.href = '/'}
          style={{ padding:'15px 40px', background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:14, fontSize:14, fontFamily:'Sora,sans-serif', fontWeight:600, color:'rgba(255,255,255,0.6)', cursor:'pointer', transition:'all 0.2s', marginTop:8 }}
        >
          Back to Home
        </button>
      </div>
    );
  }