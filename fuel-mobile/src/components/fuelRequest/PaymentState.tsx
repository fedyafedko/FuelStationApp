import type { FuelRequestDTO } from '../../types/api.types';

interface Props {
  fuelRequest: FuelRequestDTO;
  paymentDone: boolean;
  paymentTimedOut: boolean;
  paymentElapsed: number;
  dots: string;
  fmtPaymentTimer: (s: number) => string;
}

export function PaymentState({ fuelRequest, paymentDone, paymentTimedOut, paymentElapsed, dots, fmtPaymentTimer }: Props) {
  return (
    <div className="fw-payment">
      <div className="fw-payment-icon">
        {paymentDone ? '✅' : paymentTimedOut ? '⏰' : '💳'}
      </div>

      <h1 className="fw-waiting-title" style={{ marginBottom: 8 }}>
        {paymentDone ? 'Payment confirmed!' : paymentTimedOut ? 'Payment timed out' : 'Pay on the robot'}
      </h1>

      <p className="fw-waiting-sub">
        {paymentDone
          ? 'Your payment was processed. Fueling will start shortly.'
          : paymentTimedOut
            ? "You didn't complete payment in time. Please contact support or try again."
            : "Use the robot's terminal to complete your payment."}
      </p>

      <div className="fw-payment-card">
        <div className="fw-payment-amount">₴{fuelRequest.totalPrice?.toLocaleString() ?? '—'}</div>
        <div className="fw-payment-label">{fuelRequest.requestedLiters}L · Total amount due</div>
      </div>

      {!paymentDone && !paymentTimedOut && (
        <>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, marginBottom:20 }}>
            <div style={{
              fontFamily:"'DM Mono',monospace", fontSize:40, fontWeight:700,
              color: paymentElapsed > 12*60 ? '#f43f5e' : paymentElapsed > 10*60 ? '#fb923c' : '#fff',
              letterSpacing:'-0.02em', transition:'color 0.5s',
            }}>
              {fmtPaymentTimer(paymentElapsed)}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em' }}>
              time remaining to pay
            </div>
          </div>

          <div style={{ width:'100%', maxWidth:340, height:3, borderRadius:2, background:'rgba(255,255,255,0.07)', marginBottom:20, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:2,
              background: paymentElapsed > 12*60 ? '#f43f5e' : 'linear-gradient(90deg,#22c55e,#fb923c)',
              width:`${Math.max(0, 100 - (paymentElapsed / (15*60)) * 100)}%`,
              transition:'width 1s linear, background 0.5s',
            }} />
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'rgba(255,255,255,0.35)', fontFamily:"'Sora',sans-serif", maxWidth:340, width:'100%' }}>
            <div className="fw-ring" style={{ width:16, height:16, borderWidth:2, flexShrink:0 }} />
            Waiting for payment confirmation{dots}
          </div>
        </>
      )}

      {paymentDone && (
        <>
          <div className="fw-payment-done-badge" style={{ marginBottom:16 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Payment successful
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <div className="fw-ring" />
            <div className="fw-ring-label">Waiting for fueling to start{dots}</div>
          </div>
        </>
      )}

      {paymentTimedOut && (
        <button
          onClick={() => window.location.href = '/'}
          style={{ marginTop:8, padding:'15px 40px', background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:14, fontSize:14, fontFamily:'Sora,sans-serif', fontWeight:600, color:'rgba(255,255,255,0.6)', cursor:'pointer', transition:'all 0.2s' }}
        >
          Back to Home
        </button>
      )}
    </div>
  );
}