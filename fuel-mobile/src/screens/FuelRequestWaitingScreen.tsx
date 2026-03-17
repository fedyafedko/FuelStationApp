import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import RobotRouteMap from '../components/RobotRouteMap';
import type { FuelRequestDTO } from '../types/api.types';
import { fuelRequestApi } from '../api/fuelRequest.api';

const STATUS_STEPS = [
  { label: 'Order received',  sub: 'Your request is in the queue'    },
  { label: 'Finding a robot', sub: 'Matching the nearest fuel robot' },
  { label: 'Robot dispatched',sub: 'On the way to your location'     },
];

// Distance between two coords in metres (Haversine)
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const ARRIVAL_THRESHOLD_METRES = 30;

export default function FuelRequestWaitingScreen() {
  const { requestId } = useParams<{ requestId: string }>();

  const [fuelRequest, setFuelRequest] = useState<FuelRequestDTO | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [status,      setStatus]      = useState<number | null>(null);
  const [dots,        setDots]        = useState('');
  const [elapsed,     setElapsed]     = useState(0);

  // Arrived (calculated locally)
  const [robotArrived, setRobotArrived] = useState(false);

  // Code entry
  const [robotCode,      setRobotCode]      = useState('');
  const [codeError,      setCodeError]      = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);

  // Payment simulation
  const [paymentCountdown, setPaymentCountdown] = useState(0);
  const [paymentDone,      setPaymentDone]      = useState(false);
  const [paymentStarted,   setPaymentStarted]   = useState(false);

  // Send car (status 4)
  const [confirming, setConfirming] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);

  // Fueling complete
  const [completing, setCompleting] = useState(false);

  const startRef    = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completed  = status === 1;
  const inProgress = status === 2;
  const failed     = status === 4;
  const waitingPay = status === 5;
  const fueling    = status === 6;

  const stopPolling = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  const startPolling = (intervalMs = 3000) => {
    stopPolling();
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await axiosInstance.get<FuelRequestDTO>(`/api/fuel-request?requestId=${requestId}`);
        setFuelRequest(data);
        setStatus(data.status);
        if ([1, 4, 5, 6, 7].includes(data.status)) {
          stopPolling();
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, intervalMs);
  };

  useEffect(() => {
    if (!requestId) return;
    startPolling();
    return stopPolling;
  }, [requestId]);

  /* animated dots */
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  /* elapsed timer — stop when something meaningful happens */
  useEffect(() => {
    if (inProgress || failed || robotArrived || waitingPay || fueling || completed) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [status, robotArrived]);

  /* payment 5s countdown */
  useEffect(() => {
    if (!waitingPay || paymentStarted) return;
    setPaymentStarted(true);
    setPaymentCountdown(5);
    const t = setInterval(() => {
      setPaymentCountdown(c => {
        if (c <= 1) {
          clearInterval(t);
          setPaymentDone(true);
          startPolling(2000); // resume polling after payment
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [waitingPay]);

  const fmtElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  // Called by RobotRouteMap every animation frame
  const handleRobotPosition = (lat: number, lng: number, isFinished: boolean) => {
    if (robotArrived) return;
    const userLat = fuelRequest?.route?.endLat ?? 0;
    const userLng = fuelRequest?.route?.endLng ?? 0;
    const dist = haversine(lat, lng, userLat, userLng);
    if (isFinished || dist < ARRIVAL_THRESHOLD_METRES) {
      setRobotArrived(true);
    }
  };

  const handleSubmitCode = async () => {
    if (robotCode.trim().length < 3) { setCodeError('Code must be at least 3 characters'); return; }
    setCodeError('');
    setCodeSubmitting(true);
    try {
      await fuelRequestApi.confirm(requestId ?? '', robotCode);
      startPolling(2000);
    } catch {
      setCodeError('Invalid code. Please check and try again.');
    } finally {
      setCodeSubmitting(false);
    }
  };

  const handleSendCar = async () => {
    if (!requestId) return;
    setConfirming(true);
    try {
      await fuelRequestApi.sendCar(requestId);
      setConfirmed(true);
    } catch (err) { console.error(err); }
    finally { setConfirming(false); }
  };

  const handleComplete = async () => {
    if (!requestId) return;
    setCompleting(true);
    try {
      await fuelRequestApi.complete(requestId);
      setStatus(1);
    } catch (err) { console.error(err); }
    finally { setCompleting(false); }
  };

  const headerTitle = () => {
    if (confirmed)     return 'Car Dispatched';
    if (completed)     return 'Fueling Complete ✅';
    if (fueling)       return 'Fueling in Progress';
    if (waitingPay)    return 'Payment Required';
    if (robotArrived)  return 'Robot Arrived!';
    if (failed)        return 'Delivery Failed';
    if (inProgress)    return 'Robot En Route';
    return 'Waiting for Fuel';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box;margin:0;padding:0; }

        .fw-root { font-family:'Sora',sans-serif;min-height:100dvh;background:#0a0a0f;display:flex;flex-direction:column;color:#fff;position:relative;overflow:hidden; }
        .fw-orb { position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0; }
        .fw-orb-1 { width:280px;height:280px;background:radial-gradient(circle,rgba(251,146,60,0.14) 0%,transparent 70%);top:-60px;right:-40px;animation:orbDrift1 9s ease-in-out infinite alternate; }
        .fw-orb-2 { width:220px;height:220px;background:radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%);bottom:80px;left:-30px;animation:orbDrift2 11s ease-in-out infinite alternate; }
        .fw-orb-fail { width:320px;height:320px;background:radial-gradient(circle,rgba(244,63,94,0.12) 0%,transparent 70%);top:20%;left:50%;transform:translateX(-50%);animation:orbDrift1 7s ease-in-out infinite alternate; }
        .fw-orb-arrived { width:320px;height:320px;background:radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%);top:10%;left:50%;transform:translateX(-50%);animation:orbDrift1 7s ease-in-out infinite alternate; }
        @keyframes orbDrift1 { from{transform:translate(0,0)} to{transform:translate(20px,30px)} }
        @keyframes orbDrift2 { from{transform:translate(0,0)} to{transform:translate(-15px,20px)} }

        .fw-header { position:relative;z-index:10;display:flex;align-items:center;gap:12px;padding:14px 20px;background:rgba(10,10,15,0.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06); }
        .fw-back { width:36px;height:36px;border-radius:11px;flex-shrink:0;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.5);cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent; }
        .fw-back:hover { background:rgba(255,255,255,0.09);color:#fff; }
        .fw-header-title { font-size:16px;font-weight:700;letter-spacing:-0.02em;flex:1; }
        .fw-timer { font-size:13px;font-weight:600;color:rgba(255,255,255,0.35);font-family:'DM Mono',monospace;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);padding:6px 12px;border-radius:100px; }
        .fw-pill { font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-family:'DM Mono',monospace;padding:4px 8px;border-radius:6px; }
        .fw-pill-live    { color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2); }
        .fw-pill-arrived { color:#22c55e;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);animation:pillPulse 1.2s ease-in-out infinite; }
        .fw-pill-fail    { color:#f43f5e;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.2); }
        .fw-pill-pay     { color:#fb923c;background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.2); }
        .fw-pill-fueling { color:#60a5fa;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.2);animation:pillPulse 1.2s ease-in-out infinite; }
        @keyframes pillPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        .fw-body { flex:1;position:relative;z-index:1;overflow-y:auto;padding-bottom:40px; }
        .fw-body::-webkit-scrollbar { width:0; }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }

        /* waiting */
        .fw-waiting { display:flex;flex-direction:column;align-items:center;padding:40px 24px 0;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-robot-wrap { position:relative;width:110px;height:110px;margin-bottom:32px; }
        .fw-robot-bg { position:absolute;inset:0;border-radius:28px;background:linear-gradient(135deg,rgba(251,146,60,0.12),rgba(244,63,94,0.08));border:1px solid rgba(251,146,60,0.2);animation:robotPulse 2.5s ease-in-out infinite; }
        @keyframes robotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0.2)} 50%{box-shadow:0 0 0 16px rgba(251,146,60,0)} }
        .fw-robot-icon { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;animation:robotBob 2s ease-in-out infinite; }
        @keyframes robotBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .fw-badge { display:inline-flex;align-items:center;gap:7px;border-radius:100px;padding:7px 16px;margin-bottom:16px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Mono',monospace; }
        .fw-badge-orange { background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.22);color:#fb923c; }
        .fw-badge-green  { background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);color:#22c55e; }
        .fw-badge-dot { width:7px;height:7px;border-radius:50%;animation:bdPulse 1.2s ease-in-out infinite; }
        .fw-badge-dot-orange { background:#fb923c; }
        .fw-badge-dot-green  { background:#22c55e; }
        @keyframes bdPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }

        .fw-waiting-title { font-size:clamp(22px,6vw,28px);font-weight:700;letter-spacing:-0.02em;text-align:center;margin-bottom:8px; }
        .fw-waiting-sub { font-size:14px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;margin-bottom:36px; }

        .fw-steps { width:100%;max-width:340px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:20px;display:flex;flex-direction:column;margin-bottom:28px; }
        .fw-step { display:flex;align-items:flex-start;gap:14px;position:relative; }
        .fw-step:not(:last-child)::after { content:'';position:absolute;left:15px;top:32px;bottom:-12px;width:2px;background:rgba(255,255,255,0.06);border-radius:1px; }
        .fw-step:not(:last-child) { padding-bottom:20px; }
        .fw-step-icon { width:32px;height:32px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.3s; }
        .fw-step-icon.done   { background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.25); }
        .fw-step-icon.active { background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.25);animation:stepGlow 1.5s ease-in-out infinite; }
        .fw-step-icon.pending{ background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08); }
        @keyframes stepGlow { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0.3)} 50%{box-shadow:0 0 0 6px rgba(251,146,60,0)} }
        .fw-step-text { flex:1;padding-top:4px; }
        .fw-step-label { font-size:13px;font-weight:600;color:#fff; }
        .fw-step-label.pending { color:rgba(255,255,255,0.3); }
        .fw-step-sub { font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px; }

        .fw-spinner-wrap { display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:8px; }
        .fw-ring { width:44px;height:44px;border-radius:50%;border:3px solid rgba(255,255,255,0.07);border-top-color:#fb923c;animation:spin 0.9s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .fw-ring-label { font-size:12px;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace;letter-spacing:0.04em; }

        /* in progress */
        .fw-inprogress { display:flex;flex-direction:column; }
        .fw-status-bar { margin:16px 16px 0;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;animation:slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-status-bar.green { background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2); }
        .fw-status-bar.orange { background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.2); }
        .fw-status-bar.blue { background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2); }
        .fw-status-icon { width:38px;height:38px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center; }
        .fw-status-icon.green { background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.25);animation:statusPulse 2s ease-in-out infinite; }
        .fw-status-icon.orange { background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.25);animation:statusPulseOrange 2s ease-in-out infinite; }
        .fw-status-icon.blue { background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.25);animation:statusPulseBlue 2s ease-in-out infinite; }
        @keyframes statusPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.25)} 50%{box-shadow:0 0 0 8px rgba(34,197,94,0)} }
        @keyframes statusPulseOrange { 0%,100%{box-shadow:0 0 0 0 rgba(251,146,60,0.25)} 50%{box-shadow:0 0 0 8px rgba(251,146,60,0)} }
        @keyframes statusPulseBlue { 0%,100%{box-shadow:0 0 0 0 rgba(96,165,250,0.25)} 50%{box-shadow:0 0 0 8px rgba(96,165,250,0)} }
        .fw-status-text { flex:1; }
        .fw-status-title { font-size:14px;font-weight:700;color:#fff; }
        .fw-status-sub { font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px; }
        .fw-map-wrap { margin:12px 16px 0;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);animation:slideUp 0.4s 0.1s cubic-bezier(0.22,1,0.36,1) both;min-height:340px; }
        .fw-map-wrap > * { height:100% !important;min-height:340px; }

        /* ── ARRIVED / CODE modal ── */
        .fw-arrived { display:flex;flex-direction:column;align-items:center;padding:44px 24px 0;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-arrived-icon-wrap { position:relative;width:120px;height:120px;margin-bottom:28px; }
        .fw-arrived-ring { position:absolute;inset:0;border-radius:50%;border:2px solid rgba(34,197,94,0.3);animation:arrivedRing 1.8s ease-in-out infinite; }
        .fw-arrived-ring-2 { position:absolute;inset:14px;border-radius:50%;border:2px solid rgba(34,197,94,0.15);animation:arrivedRing 1.8s ease-in-out infinite 0.4s; }
        @keyframes arrivedRing { 0%{transform:scale(0.85);opacity:0.8} 100%{transform:scale(1.12);opacity:0} }
        .fw-arrived-inner { position:absolute;inset:20px;border-radius:50%;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.06));border:1.5px solid rgba(34,197,94,0.3);display:flex;align-items:center;justify-content:center;font-size:38px;animation:robotBob 3s ease-in-out infinite; }

        .fw-arrived-title { font-size:clamp(22px,6vw,28px);font-weight:700;letter-spacing:-0.02em;text-align:center;margin-bottom:8px; }
        .fw-arrived-sub { font-size:14px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;margin-bottom:32px; }

        .fw-code-card { width:100%;max-width:340px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px;margin-bottom:16px; }
        .fw-code-label { font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace;margin-bottom:10px; }
        .fw-code-input {
          width:100%;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);
          border-radius:13px;padding:16px;font-size:22px;font-weight:700;
          font-family:'DM Mono',monospace;color:#fff;outline:none;text-align:center;
          letter-spacing:0.2em;transition:border-color 0.2s,box-shadow 0.2s;
          -webkit-appearance:none;
        }
        .fw-code-input:focus { border-color:rgba(34,197,94,0.5);box-shadow:0 0 0 4px rgba(34,197,94,0.1); }
        .fw-code-input.error { border-color:rgba(244,63,94,0.5);box-shadow:0 0 0 4px rgba(244,63,94,0.08); }
        .fw-code-error { font-size:12px;color:#f87171;margin-top:8px;display:flex;align-items:center;gap:5px;font-weight:500; }

        .fw-confirm-btn {
          width:100%;max-width:340px;padding:17px;
          background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:14px;
          font-size:15px;font-family:'Sora',sans-serif;font-weight:700;color:#fff;cursor:pointer;
          box-shadow:0 8px 24px rgba(34,197,94,0.3);
          transition:opacity 0.2s,transform 0.15s;-webkit-tap-highlight-color:transparent;
          display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;
        }
        .fw-confirm-btn:hover:not(:disabled) { opacity:0.88;transform:translateY(-1px); }
        .fw-confirm-btn:active:not(:disabled) { transform:scale(0.98); }
        .fw-confirm-btn:disabled { opacity:0.4;cursor:not-allowed; }

        /* ── PAYMENT ── */
        .fw-payment { display:flex;flex-direction:column;align-items:center;padding:44px 24px 0;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-payment-icon { font-size:64px;margin-bottom:24px;animation:robotBob 2s ease-in-out infinite; }
        .fw-payment-card { width:100%;max-width:340px;background:rgba(251,146,60,0.06);border:1px solid rgba(251,146,60,0.18);border-radius:20px;padding:24px;margin-bottom:28px;text-align:center; }
        .fw-payment-amount { font-size:36px;font-weight:800;letter-spacing:-0.03em;background:linear-gradient(135deg,#fb923c,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .fw-payment-label { font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;font-family:'DM Mono',monospace; }
        .fw-payment-countdown { width:100%;max-width:340px;margin-bottom:16px; }
        .fw-countdown-bar-bg { height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden;margin-bottom:8px; }
        .fw-countdown-bar-fill { height:100%;border-radius:3px;background:linear-gradient(90deg,#fb923c,#f43f5e);transition:width 0.9s linear; }
        .fw-countdown-text { text-align:center;font-size:12px;color:rgba(255,255,255,0.35);font-family:'DM Mono',monospace; }
        .fw-payment-done-badge { display:inline-flex;align-items:center;gap:7px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:100px;padding:8px 18px;font-size:12px;font-weight:600;color:#22c55e;font-family:'DM Mono',monospace; }

        /* ── FUELING ── */
        .fw-fueling { display:flex;flex-direction:column;align-items:center;padding:44px 24px 0;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-fueling-anim { position:relative;width:120px;height:120px;margin-bottom:28px; }
        .fw-fueling-ring { position:absolute;inset:0;border-radius:50%;border:3px solid rgba(96,165,250,0.15); }
        .fw-fueling-ring-spin { position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#60a5fa;animation:spin 1.2s linear infinite; }
        .fw-fueling-inner { position:absolute;inset:16px;border-radius:50%;background:linear-gradient(135deg,rgba(96,165,250,0.15),rgba(96,165,250,0.05));border:1px solid rgba(96,165,250,0.2);display:flex;align-items:center;justify-content:center;font-size:40px; }
        .fw-fueling-title { font-size:clamp(22px,6vw,28px);font-weight:700;letter-spacing:-0.02em;text-align:center;margin-bottom:8px; }
        .fw-fueling-sub { font-size:14px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;margin-bottom:32px; }
        .fw-fueling-info { width:100%;max-width:340px;background:rgba(96,165,250,0.05);border:1px solid rgba(96,165,250,0.15);border-radius:16px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:14px; }
        .fw-fueling-info-icon { width:40px;height:40px;border-radius:12px;background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.2);display:flex;align-items:center;justify-content:center;color:#60a5fa;flex-shrink:0; }
        .fw-fueling-info-text { flex:1; }
        .fw-fueling-info-label { font-size:10px;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.06em; }
        .fw-fueling-info-val { font-size:15px;font-weight:700;color:#fff;margin-top:2px; }
        .fw-complete-btn {
          width:100%;max-width:340px;padding:18px;
          background:linear-gradient(135deg,#60a5fa,#3b82f6);border:none;border-radius:16px;
          font-size:16px;font-family:'Sora',sans-serif;font-weight:700;color:#fff;cursor:pointer;
          box-shadow:0 8px 32px rgba(96,165,250,0.3);
          transition:opacity 0.2s,transform 0.15s;-webkit-tap-highlight-color:transparent;
          display:flex;align-items:center;justify-content:center;gap:10px;
        }
        .fw-complete-btn:hover:not(:disabled) { opacity:0.88;transform:translateY(-2px); }
        .fw-complete-btn:active:not(:disabled) { transform:scale(0.98); }
        .fw-complete-btn:disabled { opacity:0.4;cursor:not-allowed; }

        /* ── FAILED ── */
        .fw-failed { display:flex;flex-direction:column;align-items:center;padding:48px 24px 0;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-fail-icon-wrap { position:relative;width:120px;height:120px;margin-bottom:32px; }
        .fw-fail-ring { position:absolute;inset:0;border-radius:50%;border:2px solid rgba(244,63,94,0.2);animation:failRingExpand 2s ease-in-out infinite; }
        .fw-fail-ring-2 { position:absolute;inset:12px;border-radius:50%;border:2px solid rgba(244,63,94,0.15);animation:failRingExpand 2s ease-in-out infinite 0.4s; }
        @keyframes failRingExpand { 0%{transform:scale(0.85);opacity:0.8} 100%{transform:scale(1.1);opacity:0} }
        .fw-fail-inner { position:absolute;inset:20px;border-radius:50%;background:linear-gradient(135deg,rgba(244,63,94,0.2),rgba(244,63,94,0.08));border:1.5px solid rgba(244,63,94,0.3);display:flex;align-items:center;justify-content:center;font-size:40px;animation:failBob 3s ease-in-out infinite; }
        @keyframes failBob { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-4px) rotate(-3deg)} 75%{transform:translateY(2px) rotate(2deg)} }
        .fw-fail-title { font-size:clamp(22px,6vw,28px);font-weight:700;letter-spacing:-0.02em;text-align:center;margin-bottom:10px; }
        .fw-fail-sub { font-size:14px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.7;margin-bottom:32px;max-width:300px; }
        .fw-fail-info-card { width:100%;max-width:340px;background:rgba(244,63,94,0.05);border:1px solid rgba(244,63,94,0.15);border-radius:18px;padding:20px;margin-bottom:32px; }
        .fw-fail-info-row { display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05); }
        .fw-fail-info-row:last-child { border-bottom:none;padding-bottom:0; }
        .fw-fail-info-row:first-child { padding-top:0; }
        .fw-fail-info-icon { width:32px;height:32px;border-radius:9px;flex-shrink:0;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.2);display:flex;align-items:center;justify-content:center;color:#f43f5e; }
        .fw-fail-info-label { font-size:10px;color:rgba(255,255,255,0.3);font-family:'DM Mono',monospace;letter-spacing:0.05em;text-transform:uppercase; }
        .fw-fail-info-value { font-size:13px;font-weight:600;color:#fff;margin-top:2px; }
        .fw-send-car-btn { width:100%;max-width:340px;padding:18px;background:linear-gradient(135deg,#fb923c,#f43f5e);border:none;border-radius:16px;font-size:16px;font-family:'Sora',sans-serif;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 8px 32px rgba(251,146,60,0.3);transition:opacity 0.2s,transform 0.15s;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px; }
        .fw-send-car-btn:hover:not(:disabled) { opacity:0.9;transform:translateY(-2px); }
        .fw-send-car-btn:disabled { opacity:0.45;cursor:not-allowed; }
        .fw-cancel-btn { width:100%;max-width:340px;padding:14px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:14px;font-size:14px;font-family:'Sora',sans-serif;font-weight:600;color:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.2s;-webkit-tap-highlight-color:transparent; }
        .fw-cancel-btn:hover { background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6); }

        /* ── COMPLETED ── */
        .fw-done { display:flex;flex-direction:column;align-items:center;padding:48px 24px 0;animation:slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fw-done-icon-wrap { position:relative;width:110px;height:110px;margin-bottom:28px; }
        .fw-done-bg { position:absolute;inset:0;border-radius:28px;background:linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.06));border:1px solid rgba(34,197,94,0.25);animation:confirmedPulse 2.5s ease-in-out infinite; }
        @keyframes confirmedPulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.2)} 50%{box-shadow:0 0 0 14px rgba(34,197,94,0)} }
        .fw-done-emoji { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:48px;animation:robotBob 2s ease-in-out infinite; }

        /* loading / error */
        .fw-center { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:40px; }
        .fw-center-icon { width:56px;height:56px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:26px; }
        .fw-center-text { font-size:15px;color:rgba(255,255,255,0.4);text-align:center; }

        .fw-btn-spinner { width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:spin 0.7s linear infinite;flex-shrink:0; }
      `}</style>

      <div className="fw-root">
        <div className="fw-orb fw-orb-1" />
        <div className="fw-orb fw-orb-2" />
        {failed && <div className="fw-orb fw-orb-fail" />}
        {robotArrived && !failed && <div className="fw-orb fw-orb-arrived" />}

        {/* Header */}
        <header className="fw-header">
          <button className="fw-back" onClick={() => window.history.back()}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="fw-header-title">{headerTitle()}</span>
          {!robotArrived && !failed && !waitingPay && !fueling && !completed && !confirmed && (
            <span className="fw-timer">{fmtElapsed(elapsed)}</span>
          )}
          {inProgress && !robotArrived && <span className="fw-pill fw-pill-live">LIVE</span>}
          {robotArrived && !waitingPay && !fueling && !completed && <span className="fw-pill fw-pill-arrived">ARRIVED</span>}
          {waitingPay && !paymentDone && <span className="fw-pill fw-pill-pay">PAY NOW</span>}
          {fueling && <span className="fw-pill fw-pill-fueling">FUELING</span>}
          {failed && !confirmed && <span className="fw-pill fw-pill-fail">ACTION NEEDED</span>}
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

          {!loading && !fuelRequest && (
            <div className="fw-center">
              <div className="fw-center-icon">❓</div>
              <div className="fw-center-text">Order not found.<br />Please go back and try again.</div>
            </div>
          )}

          {/* ── WAITING (Pending) ── */}
          {!loading && fuelRequest && !inProgress && !failed && !robotArrived && !waitingPay && !fueling && !completed && !confirmed && (
            <div className="fw-waiting">
              <div className="fw-robot-wrap">
                <div className="fw-robot-bg" />
                <div className="fw-robot-icon">🤖</div>
              </div>
              <div className={`fw-badge fw-badge-orange`}>
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
                        {s === 'done'   && <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {s === 'active' && <div style={{width:10,height:10,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fb923c',animation:'spin 0.8s linear infinite'}} />}
                        {s === 'pending'&& <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,0.15)'}} />}
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
            </div>
          )}

          {/* ── IN PROGRESS (robot moving) ── */}
          {!loading && fuelRequest && inProgress && !robotArrived && (
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
                    onPositionChange={handleRobotPosition}
                  />
                </div>
              ) : (
                <div style={{ margin: '12px 16px 0', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Route is being calculated…</div>
                </div>
              )}
            </div>
          )}

          {/* ── ROBOT ARRIVED — enter code ── */}
          {!loading && fuelRequest && robotArrived && !waitingPay && !fueling && !completed && (
            <div className="fw-arrived">
              <div className="fw-arrived-icon-wrap">
                <div className="fw-arrived-ring" />
                <div className="fw-arrived-ring-2" />
                <div className="fw-arrived-inner">🤖</div>
              </div>
              <div className="fw-badge fw-badge-green">
                <span className="fw-badge-dot fw-badge-dot-green" />
                Robot is here
              </div>
              <h1 className="fw-arrived-title">Your robot arrived!</h1>
              <p className="fw-arrived-sub">Enter the unique code displayed on the robot's screen to unlock fueling.</p>

              <div className="fw-code-card">
                <div className="fw-code-label">Robot unlock code</div>
                <input
                  className={`fw-code-input${codeError ? ' error' : ''}`}
                  placeholder="• • • •"
                  value={robotCode}
                  maxLength={8}
                  onChange={e => { setRobotCode(e.target.value.toUpperCase()); setCodeError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitCode()}
                />
                {codeError && (
                  <div className="fw-code-error">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {codeError}
                  </div>
                )}
              </div>

              <button className="fw-confirm-btn" onClick={handleSubmitCode} disabled={codeSubmitting || robotCode.trim().length < 3}>
                {codeSubmitting
                  ? <><div className="fw-btn-spinner" /> Verifying…</>
                  : <>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Confirm Code
                    </>
                }
              </button>
            </div>
          )}

          {/* ── WAITING PAYMENT (status 5) ── */}
          {!loading && fuelRequest && waitingPay && (
            <div className="fw-payment">
              <div className="fw-payment-icon">{paymentDone ? '✅' : '💳'}</div>
              <h1 className="fw-waiting-title" style={{ marginBottom: 8 }}>
                {paymentDone ? 'Payment confirmed!' : 'Pay on the robot'}
              </h1>
              <p className="fw-waiting-sub">
                {paymentDone
                  ? 'Your payment was processed. Fueling will start shortly.'
                  : 'Use the robot\'s terminal to complete your payment. Processing automatically…'
                }
              </p>

              <div className="fw-payment-card">
                <div className="fw-payment-amount">₴{fuelRequest.totalPrice?.toLocaleString() ?? '—'}</div>
                <div className="fw-payment-label">{fuelRequest.requestedLiters}L · Total amount due</div>
              </div>

              {!paymentDone ? (
                <div className="fw-payment-countdown">
                  <div className="fw-countdown-bar-bg">
                    <div className="fw-countdown-bar-fill" style={{ width: `${(paymentCountdown / 5) * 100}%` }} />
                  </div>
                  <div className="fw-countdown-text">Simulating payment… {paymentCountdown}s</div>
                </div>
              ) : (
                <div className="fw-payment-done-badge">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Payment successful
                </div>
              )}

              {paymentDone && (
                <div style={{ marginTop: 16 }}>
                  <div className="fw-ring" />
                  <div className="fw-ring-label" style={{ marginTop: 10, textAlign: 'center' }}>Waiting for fueling to start{dots}</div>
                </div>
              )}
            </div>
          )}

          {/* ── START FUELING (status 6) ── */}
          {!loading && fuelRequest && fueling && (
            <div className="fw-fueling">
              <div className="fw-fueling-anim">
                <div className="fw-fueling-ring" />
                <div className="fw-fueling-ring-spin" />
                <div className="fw-fueling-inner">⛽</div>
              </div>

              <div className="fw-badge fw-badge-green" style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)', color: '#60a5fa' }}>
                <span className="fw-badge-dot" style={{ background: '#60a5fa' }} />
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

              <button className="fw-complete-btn" onClick={handleComplete} disabled={completing}>
                {completing
                  ? <><div className="fw-btn-spinner" /> Completing…</>
                  : <>
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Fueling Complete
                    </>
                }
              </button>
            </div>
          )}

          {/* ── FAILED (status 4) ── */}
          {!loading && fuelRequest && failed && !confirmed && (
            <div className="fw-failed">
              <div className="fw-fail-icon-wrap">
                <div className="fw-fail-ring" />
                <div className="fw-fail-ring-2" />
                <div className="fw-fail-inner">😔</div>
              </div>
              <div className="fw-badge" style={{ background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.25)', color: '#f43f5e' }}>
                <span className="fw-badge-dot" style={{ background: '#f43f5e' }} />
                Delivery failed
              </div>
              <h1 className="fw-fail-title">Robot couldn't arrive</h1>
              <p className="fw-fail-sub">The fuel robot was unable to reach your location. We can send a car with fuel instead — same amount, no extra charge.</p>
              <div className="fw-fail-info-card">
                <div className="fw-fail-info-row">
                  <div className="fw-fail-info-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div><div className="fw-fail-info-label">Original order</div><div className="fw-fail-info-value">{fuelRequest.requestedLiters ?? '—'} L of fuel</div></div>
                </div>
                <div className="fw-fail-info-row">
                  <div className="fw-fail-info-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" /><circle cx="7.5" cy="16" r="1.2" fill="currentColor" stroke="none" /><circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" /></svg>
                  </div>
                  <div><div className="fw-fail-info-label">Alternative</div><div className="fw-fail-info-value">Fuel delivery by car</div></div>
                </div>
                <div className="fw-fail-info-row">
                  <div className="fw-fail-info-icon">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div><div className="fw-fail-info-label">Extra cost</div><div className="fw-fail-info-value" style={{ color: '#22c55e' }}>None — same price</div></div>
                </div>
              </div>
              <button className="fw-send-car-btn" onClick={handleSendCar} disabled={confirming}>
                {confirming
                  ? <><div className="fw-btn-spinner" /> Sending car…</>
                  : <>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" /><circle cx="7.5" cy="16" r="1.2" fill="white" stroke="none" /><circle cx="16.5" cy="16" r="1.2" fill="white" stroke="none" /></svg>
                      </div>
                      Send a Car with Fuel
                    </>
                }
              </button>
              <button className="fw-cancel-btn" onClick={() => window.location.href = '/'}>Cancel & Go Home</button>
            </div>
          )}

          {/* ── COMPLETED / CONFIRMED ── */}
          {(!loading && (completed || confirmed)) && (
            <div className="fw-done">
              <div className="fw-done-icon-wrap">
                <div className="fw-done-bg" />
                <div className="fw-done-emoji">{confirmed ? '🚗' : '✅'}</div>
              </div>
              <div className="fw-badge fw-badge-green" style={{ marginBottom: 16 }}>
                <span className="fw-badge-dot fw-badge-dot-green" />
                {confirmed ? 'Car dispatched' : 'All done'}
              </div>
              <h1 className="fw-waiting-title" style={{ marginBottom: 10 }}>
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
                style={{ padding: '15px 40px', background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, fontSize: 14, fontFamily: 'Sora, sans-serif', fontWeight: 600, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', marginTop: 8 }}
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