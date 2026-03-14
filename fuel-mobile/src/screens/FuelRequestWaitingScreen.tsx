import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import RobotRouteMap from '../components/RobotRouteMap';
import type { FuelRequestDTO } from '../types/api.types';

const STATUS_STEPS = [
  { label: 'Order received',   sub: 'Your request is in the queue'     },
  { label: 'Finding a robot',  sub: 'Matching the nearest fuel robot'  },
  { label: 'Robot dispatched', sub: 'On the way to your location'      },
];

export default function FuelRequestWaitingScreen() {
  const { requestId } = useParams<{ requestId: string }>();

  const [fuelRequest, setFuelRequest] = useState<FuelRequestDTO | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [inProgress,  setInProgress]  = useState(false);
  const [failed,      setFailed]      = useState(false);
  const [dots,        setDots]        = useState('');
  const [elapsed,     setElapsed]     = useState(0);
  const [confirming,  setConfirming]  = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);
  const startRef = useRef(Date.now());

  /* polling */
  useEffect(() => {
    if (!requestId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axiosInstance.get<FuelRequestDTO>(`/api/fuel-request?requestId=${requestId}`);
        setFuelRequest(data);
        if (data.status === 2) { setInProgress(true); clearInterval(interval); }
        if (data.status === 4) { setFailed(true);     clearInterval(interval); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, 3000);
    return () => clearInterval(interval);
  }, [requestId]);

  /* animated dots */
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  /* elapsed timer */
  useEffect(() => {
    if (inProgress || failed) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [inProgress, failed]);

  const fmtElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const handleSendCar = async () => {
    if (!requestId) return;
    setConfirming(true);
    try {
      await axiosInstance.post(`/api/fuel-request/${requestId}/send-car`);
      setConfirmed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fw-root {
          font-family: 'Sora', sans-serif;
          min-height: 100dvh; background: #0a0a0f;
          display: flex; flex-direction: column; color: #fff;
          position: relative; overflow: hidden;
        }

        .fw-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .fw-orb-1 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(251,146,60,0.14) 0%, transparent 70%);
          top: -60px; right: -40px;
          animation: orbDrift1 9s ease-in-out infinite alternate;
        }
        .fw-orb-2 {
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%);
          bottom: 80px; left: -30px;
          animation: orbDrift2 11s ease-in-out infinite alternate;
        }
        .fw-orb-fail {
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%);
          top: 20%; left: 50%; transform: translateX(-50%);
          animation: orbDrift1 7s ease-in-out infinite alternate;
        }
        @keyframes orbDrift1 { from{transform:translate(0,0)} to{transform:translate(20px,30px)} }
        @keyframes orbDrift2 { from{transform:translate(0,0)} to{transform:translate(-15px,20px)} }

        .fw-header {
          position: relative; z-index: 10;
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px;
          background: rgba(10,10,15,0.9); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fw-back {
          width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .fw-back:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .fw-header-title { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; flex: 1; }
        .fw-timer {
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.35);
          font-family: 'DM Mono', monospace;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          padding: 6px 12px; border-radius: 100px;
        }
        .fw-status-live {
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #22c55e; font-family: 'DM Mono', monospace;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          padding: 4px 8px; border-radius: 6px;
        }
        .fw-status-fail-pill {
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #f43f5e; font-family: 'DM Mono', monospace;
          background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2);
          padding: 4px 8px; border-radius: 6px;
        }

        .fw-body { flex: 1; position: relative; z-index: 1; overflow-y: auto; padding-bottom: 40px; }
        .fw-body::-webkit-scrollbar { width: 0; }

        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }

        /* waiting */
        .fw-waiting {
          display: flex; flex-direction: column; align-items: center;
          padding: 40px 24px 0;
          animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fw-robot-wrap { position: relative; width: 110px; height: 110px; margin-bottom: 32px; }
        .fw-robot-bg {
          position: absolute; inset: 0; border-radius: 28px;
          background: linear-gradient(135deg, rgba(251,146,60,0.12), rgba(244,63,94,0.08));
          border: 1px solid rgba(251,146,60,0.2);
          animation: robotPulse 2.5s ease-in-out infinite;
        }
        @keyframes robotPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(251,146,60,0.2); }
          50%      { box-shadow: 0 0 0 16px rgba(251,146,60,0); }
        }
        .fw-robot-icon {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 48px; animation: robotBob 2s ease-in-out infinite;
        }
        @keyframes robotBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .fw-waiting-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.22);
          border-radius: 100px; padding: 7px 16px; margin-bottom: 16px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: #fb923c; font-family: 'DM Mono', monospace;
        }
        .fw-badge-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #fb923c;
          animation: bdPulse 1.2s ease-in-out infinite;
        }
        @keyframes bdPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }

        .fw-waiting-title {
          font-size: clamp(22px,6vw,28px); font-weight: 700;
          letter-spacing: -0.02em; text-align: center; margin-bottom: 8px;
        }
        .fw-waiting-sub {
          font-size: 14px; color: rgba(255,255,255,0.4); text-align: center;
          line-height: 1.6; margin-bottom: 36px;
        }

        .fw-steps {
          width: 100%; max-width: 340px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 20px; display: flex; flex-direction: column;
          margin-bottom: 28px;
        }
        .fw-step { display: flex; align-items: flex-start; gap: 14px; position: relative; }
        .fw-step:not(:last-child)::after {
          content:''; position:absolute; left:15px; top:32px; bottom:-12px; width:2px;
          background:rgba(255,255,255,0.06); border-radius:1px;
        }
        .fw-step:not(:last-child) { padding-bottom: 20px; }
        .fw-step-icon {
          width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; transition: all 0.3s;
        }
        .fw-step-icon.done  { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.25); }
        .fw-step-icon.active { background:rgba(251,146,60,0.15); border:1px solid rgba(251,146,60,0.25); animation:stepGlow 1.5s ease-in-out infinite; }
        .fw-step-icon.pending { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
        @keyframes stepGlow { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0.3)} 50%{box-shadow:0 0 0 6px rgba(251,146,60,0)} }
        .fw-step-text { flex: 1; padding-top: 4px; }
        .fw-step-label { font-size: 13px; font-weight: 600; color: #fff; }
        .fw-step-label.pending { color: rgba(255,255,255,0.3); }
        .fw-step-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        .fw-spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 8px; }
        .fw-ring {
          width: 44px; height: 44px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.07); border-top-color: #fb923c;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        .fw-ring-label { font-size: 12px; color: rgba(255,255,255,0.3); font-family: 'DM Mono', monospace; letter-spacing: 0.04em; }

        /* in progress */
        .fw-inprogress { display: flex; flex-direction: column; }
        .fw-status-bar {
          margin: 16px 16px 0;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
          border-radius: 16px; padding: 14px 16px;
          display: flex; align-items: center; gap: 12px;
          animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fw-status-icon {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.25);
          display: flex; align-items: center; justify-content: center;
          animation: statusPulse 2s ease-in-out infinite;
        }
        @keyframes statusPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.25)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }
        .fw-status-text { flex: 1; }
        .fw-status-title { font-size: 14px; font-weight: 700; color: #fff; }
        .fw-status-sub   { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .fw-map-wrap {
          margin: 12px 16px 0; border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          animation: slideUp 0.4s 0.1s cubic-bezier(0.22,1,0.36,1) both;
          min-height: 340px;
        }
        .fw-map-wrap > * { height: 100% !important; min-height: 340px; }
        .fw-no-route {
          margin: 12px 16px 0;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 32px 20px; text-align: center;
        }
        .fw-no-route-icon {
          width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; font-size: 22px;
        }
        .fw-no-route-text { font-size: 14px; color: rgba(255,255,255,0.4); }

        /* ── FAILED state ── */
        .fw-failed {
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 24px 0;
          animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        .fw-fail-icon-wrap {
          position: relative; width: 120px; height: 120px; margin-bottom: 32px;
        }
        .fw-fail-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px solid rgba(244,63,94,0.2);
          animation: failRingExpand 2s ease-in-out infinite;
        }
        .fw-fail-ring-2 {
          position: absolute; inset: 12px; border-radius: 50%;
          border: 2px solid rgba(244,63,94,0.15);
          animation: failRingExpand 2s ease-in-out infinite 0.4s;
        }
        @keyframes failRingExpand {
          0%   { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.1);  opacity: 0; }
        }
        .fw-fail-icon-inner {
          position: absolute; inset: 20px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(244,63,94,0.2), rgba(244,63,94,0.08));
          border: 1.5px solid rgba(244,63,94,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 40px;
          animation: failBob 3s ease-in-out infinite;
        }
        @keyframes failBob {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-4px) rotate(-3deg); }
          75%      { transform: translateY(2px) rotate(2deg); }
        }

        .fw-fail-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.25);
          border-radius: 100px; padding: 7px 16px; margin-bottom: 16px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; color: #f43f5e; font-family: 'DM Mono', monospace;
        }
        .fw-fail-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #f43f5e;
          animation: bdPulse 1.5s ease-in-out infinite;
        }

        .fw-fail-title {
          font-size: clamp(22px,6vw,28px); font-weight: 700;
          letter-spacing: -0.02em; text-align: center; margin-bottom: 10px;
        }
        .fw-fail-sub {
          font-size: 14px; color: rgba(255,255,255,0.4); text-align: center;
          line-height: 1.7; margin-bottom: 32px; max-width: 300px;
        }

        .fw-fail-info-card {
          width: 100%; max-width: 340px;
          background: rgba(244,63,94,0.05); border: 1px solid rgba(244,63,94,0.15);
          border-radius: 18px; padding: 20px; margin-bottom: 32px;
        }
        .fw-fail-info-row {
          display: flex; align-items: center; gap: 12px; padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .fw-fail-info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .fw-fail-info-row:first-child { padding-top: 0; }
        .fw-fail-info-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2);
          display: flex; align-items: center; justify-content: center; color: #f43f5e;
        }
        .fw-fail-info-text { flex: 1; }
        .fw-fail-info-label { font-size: 10px; color: rgba(255,255,255,0.3); font-family: 'DM Mono', monospace; letter-spacing: 0.05em; text-transform: uppercase; }
        .fw-fail-info-value { font-size: 13px; font-weight: 600; color: #fff; margin-top: 2px; }

        /* car confirmation section */
        .fw-car-confirm {
          width: 100%; max-width: 340px; margin-bottom: 16px;
        }
        .fw-car-confirm-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
          font-family: 'DM Mono', monospace; margin-bottom: 12px; padding-left: 2px;
        }

        .fw-send-car-btn {
          width: 100%; padding: 18px;
          background: linear-gradient(135deg, #fb923c, #f43f5e);
          border: none; border-radius: 16px;
          font-size: 16px; font-family: 'Sora', sans-serif; font-weight: 700;
          color: #fff; cursor: pointer; letter-spacing: -0.01em;
          box-shadow: 0 8px 32px rgba(251,146,60,0.3);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          position: relative; overflow: hidden;
        }
        .fw-send-car-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .fw-send-car-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(251,146,60,0.4); }
        .fw-send-car-btn:active:not(:disabled) { transform: scale(0.98); }
        .fw-send-car-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .fw-send-car-btn-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .fw-btn-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }

        .fw-cancel-btn {
          width: 100%; max-width: 340px; padding: 14px;
          background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px; font-size: 14px; font-family: 'Sora', sans-serif;
          font-weight: 600; color: rgba(255,255,255,0.35); cursor: pointer;
          transition: all 0.2s; -webkit-tap-highlight-color: transparent; margin-bottom: 8px;
        }
        .fw-cancel-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); }

        /* confirmed success state */
        .fw-confirmed {
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 24px 0;
          animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .fw-confirmed-icon-wrap {
          position: relative; width: 110px; height: 110px; margin-bottom: 28px;
        }
        .fw-confirmed-bg {
          position: absolute; inset: 0; border-radius: 28px;
          background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.06));
          border: 1px solid rgba(34,197,94,0.25);
          animation: confirmedPulse 2.5s ease-in-out infinite;
        }
        @keyframes confirmedPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.2)} 50%{box-shadow:0 0 0 14px rgba(34,197,94,0)}
        }
        .fw-confirmed-emoji {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 48px; animation: robotBob 2s ease-in-out infinite;
        }
        .fw-confirmed-title {
          font-size: clamp(22px,6vw,26px); font-weight: 700;
          letter-spacing: -0.02em; text-align: center; margin-bottom: 10px;
        }
        .fw-confirmed-sub {
          font-size: 14px; color: rgba(255,255,255,0.4); text-align: center;
          line-height: 1.7; margin-bottom: 32px; max-width: 280px;
        }
        .fw-confirmed-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
          border-radius: 100px; padding: 8px 18px; margin-bottom: 20px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: #22c55e; font-family: 'DM Mono', monospace;
        }
        .fw-confirmed-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          animation: bdPulse 1.5s ease-in-out infinite;
        }

        /* loading / error */
        .fw-center {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 14px; padding: 40px;
        }
        .fw-center-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; font-size: 26px;
        }
        .fw-center-text { font-size: 15px; color: rgba(255,255,255,0.4); text-align: center; }
      `}</style>

      <div className="fw-root">
        <div className="fw-orb fw-orb-1" />
        <div className="fw-orb fw-orb-2" />
        {failed && <div className="fw-orb fw-orb-fail" />}

        {/* Header */}
        <header className="fw-header">
          <button className="fw-back" onClick={() => window.history.back()}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="fw-header-title">
            {confirmed   ? 'Car Dispatched'   :
             failed      ? 'Delivery Failed'  :
             inProgress  ? 'Robot En Route'   : 'Waiting for Fuel'}
          </span>
          {!inProgress && !failed && !confirmed && (
            <span className="fw-timer">{fmtElapsed(elapsed)}</span>
          )}
          {inProgress && !failed && (
            <span className="fw-status-live">LIVE</span>
          )}
          {failed && !confirmed && (
            <span className="fw-status-fail-pill">ACTION NEEDED</span>
          )}
        </header>

        <div className="fw-body">

          {/* Loading */}
          {loading && (
            <div className="fw-center">
              <div className="fw-center-icon">⛽</div>
              <div className="fw-ring" />
              <div className="fw-center-text">Loading your order…</div>
            </div>
          )}

          {/* Not found */}
          {!loading && !fuelRequest && (
            <div className="fw-center">
              <div className="fw-center-icon">❓</div>
              <div className="fw-center-text">Order not found.<br />Please go back and try again.</div>
            </div>
          )}

          {/* ── WAITING ── */}
          {!loading && fuelRequest && !inProgress && !failed && (
            <div className="fw-waiting">
              <div className="fw-robot-wrap">
                <div className="fw-robot-bg" />
                <div className="fw-robot-icon">🤖</div>
              </div>

              <div className="fw-waiting-badge">
                <span className="fw-badge-dot" />
                Searching{dots}
              </div>

              <h1 className="fw-waiting-title">Finding your robot</h1>
              <p className="fw-waiting-sub">
                We're matching the nearest fuel robot<br />to your location. Hang tight!
              </p>

              <div className="fw-steps">
                {STATUS_STEPS.map((step, i) => {
                  const status = i === 0 ? 'done' : i === 1 ? 'active' : 'pending';
                  return (
                    <div className="fw-step" key={i}>
                      <div className={`fw-step-icon ${status}`}>
                        {status === 'done' && (
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {status === 'active' && (
                          <div style={{ width:10, height:10, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fb923c', animation:'spin 0.8s linear infinite' }} />
                        )}
                        {status === 'pending' && (
                          <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,255,255,0.15)' }} />
                        )}
                      </div>
                      <div className="fw-step-text">
                        <div className={`fw-step-label${status === 'pending' ? ' pending' : ''}`}>{step.label}</div>
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
            </div>
          )}

          {/* ── IN PROGRESS ── */}
          {!loading && fuelRequest && inProgress && (
            <div className="fw-inprogress">
              <div className="fw-status-bar">
                <div className="fw-status-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="fw-status-text">
                  <div className="fw-status-title">Robot dispatched 🤖</div>
                  <div className="fw-status-sub">Follow live location on the map below</div>
                </div>
              </div>

              {fuelRequest.route?.geometry ? (
                <div className="fw-map-wrap">
                  <RobotRouteMap encodedPolyline={fuelRequest.route.geometry} speed={0.005} height="100%" />
                </div>
              ) : (
                <div className="fw-no-route">
                  <div className="fw-no-route-icon">🗺️</div>
                  <div className="fw-no-route-text">Route is being calculated…</div>
                </div>
              )}
            </div>
          )}

          {/* ── FAILED (status 4) ── */}
          {!loading && fuelRequest && failed && !confirmed && (
            <div className="fw-failed">

              <div className="fw-fail-icon-wrap">
                <div className="fw-fail-ring" />
                <div className="fw-fail-ring-2" />
                <div className="fw-fail-icon-inner">😔</div>
              </div>

              <div className="fw-fail-badge">
                <span className="fw-fail-badge-dot" />
                Delivery failed
              </div>

              <h1 className="fw-fail-title">Robot couldn't arrive</h1>
              <p className="fw-fail-sub">
                The fuel robot was unable to reach your location.
                We can send a car with fuel instead — same amount, no extra charge.
              </p>

              {/* Info card */}
              <div className="fw-fail-info-card">
                <div className="fw-fail-info-row">
                  <div className="fw-fail-info-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="fw-fail-info-text">
                    <div className="fw-fail-info-label">Original order</div>
                    <div className="fw-fail-info-value">{fuelRequest.requestedLiters ?? '—'} L of fuel</div>
                  </div>
                </div>
                <div className="fw-fail-info-row">
                  <div className="fw-fail-info-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                      <circle cx="7.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div className="fw-fail-info-text">
                    <div className="fw-fail-info-label">Alternative</div>
                    <div className="fw-fail-info-value">Fuel delivery by car</div>
                  </div>
                </div>
                <div className="fw-fail-info-row">
                  <div className="fw-fail-info-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="fw-fail-info-text">
                    <div className="fw-fail-info-label">Extra cost</div>
                    <div className="fw-fail-info-value" style={{ color: '#22c55e' }}>None — same price</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="fw-car-confirm">
                <div className="fw-car-confirm-label">Choose how to proceed</div>
                <button
                  className="fw-send-car-btn"
                  onClick={handleSendCar}
                  disabled={confirming}
                >
                  {confirming ? (
                    <><div className="fw-btn-spinner" /> Sending car…</>
                  ) : (
                    <>
                      <div className="fw-send-car-btn-icon">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                          <circle cx="7.5" cy="16" r="1.2" fill="white" stroke="none" />
                          <circle cx="16.5" cy="16" r="1.2" fill="white" stroke="none" />
                        </svg>
                      </div>
                      Send a Car with Fuel
                    </>
                  )}
                </button>
              </div>

              <button className="fw-cancel-btn" onClick={() => window.location.href = '/'}>
                Cancel & Go Home
              </button>
            </div>
          )}

          {/* ── CONFIRMED ── */}
          {confirmed && (
            <div className="fw-confirmed">
              <div className="fw-confirmed-icon-wrap">
                <div className="fw-confirmed-bg" />
                <div className="fw-confirmed-emoji">🚗</div>
              </div>

              <div className="fw-confirmed-badge">
                <span className="fw-confirmed-dot" />
                Car dispatched
              </div>

              <h1 className="fw-confirmed-title">Car is on the way!</h1>
              <p className="fw-confirmed-sub">
                A driver has been assigned and is heading to your location with fuel. You'll be refueled shortly.
              </p>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '15px 40px', background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                  fontSize: 14, fontFamily: 'Sora, sans-serif', fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Back to Home
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}