import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import type { FuelRequestDTO } from '../../types/api.types';
import { fuelRequestApi } from '../../api/fuelRequest.api';

import { WaitingState }    from '../../components/fuelRequest/WaitingState';
import { InProgressState } from '../../components/fuelRequest/InProgressState';
import { ArrivedState }    from '../../components/fuelRequest/ArrivedState';
import { PaymentState }    from '../../components/fuelRequest/PaymentState';
import { FuelingState }    from '../../components/fuelRequest/FuelingState';
import { FailedState }     from '../../components/fuelRequest/FailedState';
import { CompletedState }  from '../../components/fuelRequest/CompletedState';
import { CancelModal }     from '../../components/fuelRequest/CancelModal';

import '../../components/fuelRequest/fuelRequest.css';

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

  const [dots,    setDots]    = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const [robotArrived, setRobotArrived] = useState(false);

  const [robotCode,      setRobotCode]      = useState('FS-');
  const [codeError,      setCodeError]      = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);

  const [paymentDone,     setPaymentDone]     = useState(false);
  const [paymentStarted,  setPaymentStarted]  = useState(false);
  const [paymentElapsed,  setPaymentElapsed]  = useState(0);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);
  const paymentStartTimeRef = useRef<number | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);

  const [completing, setCompleting] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason,    setCancelReason]    = useState('');
  const [cancelling,      setCancelling]      = useState(false);
  const [cancelError,     setCancelError]     = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };
  const startPolling = (intervalMs = 30) => {
    stopPolling();
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await axiosInstance.get<FuelRequestDTO>(`/api/fuel-request?requestId=${requestId}`);
        setFuelRequest(data);
        setStatus(data.status);
        if ([1, 4, 5, 6, 7].includes(data.status)) stopPolling();
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, intervalMs);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(`fuel-request-${requestId}`);
    if (saved) {
      const s = JSON.parse(saved);
      if (s.robotArrived)   setRobotArrived(true);
      if (s.paymentDone)    setPaymentDone(true);
      if (s.paymentStarted) setPaymentStarted(true);
      if (s.confirmed)      setConfirmed(true);
      if (s.paymentStartTime) {
        paymentStartTimeRef.current = s.paymentStartTime;
        setPaymentElapsed(Math.floor((Date.now() - s.paymentStartTime) / 1000));
      }
    }
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;
    sessionStorage.setItem(`fuel-request-${requestId}`, JSON.stringify({
      robotArrived, paymentDone, paymentStarted, confirmed,
      paymentStartTime: paymentStartTimeRef.current,
    }));
  }, [robotArrived, paymentDone, paymentStarted, confirmed, requestId]);

  useEffect(() => {
    if (status === 1) sessionStorage.removeItem(`fuel-request-${requestId}`);
  }, [status, requestId]);

  useEffect(() => {
    if (!requestId) return;
    startPolling();
    return stopPolling;
  }, [requestId]);

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  const completed  = status === 1;
  const inProgress = status === 2;
  const failed     = status === 4;
  const waitingPay = status === 5;
  const fueling    = status === 6;

  useEffect(() => {
    if (inProgress || failed || robotArrived || waitingPay || fueling || completed) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [status, robotArrived]);

  // ── Payment flow ──
  useEffect(() => {
    if (!waitingPay || paymentStarted) return;
    setPaymentStarted(true);
    if (!paymentStartTimeRef.current) paymentStartTimeRef.current = Date.now();

    const processPayment = async () => {
      try {
        await fuelRequestApi.paid(requestId ?? '');
        setPaymentDone(true);
        startPolling(2000);
      } catch (err) {
        console.error('Payment failed:', err);
        setPaymentStarted(false);
      }
    };
    processPayment();

    const timer = setInterval(() => {
      const el = Math.floor((Date.now() - (paymentStartTimeRef.current ?? Date.now())) / 1000);
      setPaymentElapsed(el);
      if (el >= 15 * 60) {
        clearInterval(timer);
        setPaymentTimedOut(true);
        fuelRequestApi.paid(requestId ?? '').catch(console.error);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [waitingPay]);

  const fmtElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const fmtPaymentTimer = (s: number) => {
    const remaining = Math.max(0, 15 * 60 - s);
    return `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`;
  };

  const handleRobotPosition = (lat: number, lng: number, isFinished: boolean) => {
    if (robotArrived) return;
    const dist = haversine(lat, lng, fuelRequest?.route?.endLat ?? 0, fuelRequest?.route?.endLng ?? 0);
    if (isFinished || dist < ARRIVAL_THRESHOLD_METRES) setRobotArrived(true);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase();
    if (!raw.startsWith('FS-')) raw = 'FS-';
    const rest = raw.slice(3).replace(/[^A-Z0-9]/g, '');
    let formatted = 'FS-';
    if (rest.length > 0) {
      const letters = rest.slice(0, 2).replace(/[^A-Z]/g, '');
      formatted += letters;
      if (letters.length === 2 && rest.length > 2) {
        const digits1 = rest.slice(2, 4).replace(/[^0-9]/g, '');
        formatted += '-' + digits1;
        if (digits1.length === 2 && rest.length > 4) {
          formatted += '-' + rest.slice(4, 8).replace(/[^0-9]/g, '');
        }
      }
    }
    setRobotCode(formatted);
    setCodeError('');
  };

  const handleSubmitCode = async () => {
    if (robotCode.length < 13) { setCodeError('Please enter the full code — e.g. FS-RB-01-0123'); return; }
    setCodeError('');
    setCodeSubmitting(true);
    try {
      await fuelRequestApi.confirm(requestId ?? '', robotCode);
      startPolling(2000);
    } catch { setCodeError('Invalid code. Please check and try again.'); }
    finally { setCodeSubmitting(false); }
  };

  const handleSendCar = async () => {
    if (!requestId) return;
    setConfirming(true);
    try { await fuelRequestApi.sendCar(requestId); setConfirmed(true); }
    catch (err) { console.error(err); }
    finally { setConfirming(false); }
  };

  const handleComplete = async () => {
    if (!requestId) return;
    setCompleting(true);
    try { await fuelRequestApi.complete(requestId); setStatus(1); }
    catch (err) { console.error(err); }
    finally { setCompleting(false); }
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) { setCancelError('Please select or enter a reason'); return; }
    if (!requestId) return;
    setCancelling(true);
    setCancelError('');
    try {
      await fuelRequestApi.cancel(requestId, cancelReason);
      sessionStorage.removeItem(`fuel-request-${requestId}`);
      window.location.href = '/';
    } catch { setCancelError('Failed to cancel. Please try again.'); }
    finally { setCancelling(false); }
  };

  const headerTitle = () => {
    if (confirmed)    return 'Car Dispatched';
    if (completed)    return 'Fueling Complete ✅';
    if (fueling)      return 'Fueling in Progress';
    if (waitingPay)   return 'Payment Required';
    if (robotArrived) return 'Robot Arrived!';
    if (failed)       return 'Delivery Failed';
    if (inProgress)   return 'Robot En Route';
    return 'Waiting for Fuel';
  };

  return (
    <div className="fw-root">
      <div className="fw-orb fw-orb-1" />
      <div className="fw-orb fw-orb-2" />
      {failed       && <div className="fw-orb fw-orb-fail" />}
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
        {inProgress  && !robotArrived                       && <span className="fw-pill fw-pill-live">LIVE</span>}
        {robotArrived && !waitingPay && !fueling && !completed && <span className="fw-pill fw-pill-arrived">ARRIVED</span>}
        {waitingPay  && !paymentDone                         && <span className="fw-pill fw-pill-pay">PAY NOW</span>}
        {fueling                                              && <span className="fw-pill fw-pill-fueling">FUELING</span>}
        {failed      && !confirmed                           && <span className="fw-pill fw-pill-fail">ACTION NEEDED</span>}
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

        {/* Waiting */}
        {!loading && fuelRequest && !inProgress && !failed && !robotArrived && !waitingPay && !fueling && !completed && !confirmed && (
          <WaitingState dots={dots} onCancel={() => setShowCancelModal(true)} />
        )}

        {/* In progress */}
        {!loading && fuelRequest && inProgress && !robotArrived && (
          <InProgressState fuelRequest={fuelRequest} onPositionChange={handleRobotPosition} />
        )}

        {/* Robot arrived — enter code */}
        {!loading && fuelRequest && robotArrived && !waitingPay && !fueling && !completed && (
          <ArrivedState
            robotCode={robotCode}
            codeError={codeError}
            codeSubmitting={codeSubmitting}
            onChange={handleCodeChange}
            onSubmit={handleSubmitCode}
          />
        )}

        {/* Waiting payment */}
        {!loading && fuelRequest && waitingPay && (
          <PaymentState
            fuelRequest={fuelRequest}
            paymentDone={paymentDone}
            paymentTimedOut={paymentTimedOut}
            paymentElapsed={paymentElapsed}
            dots={dots}
            fmtPaymentTimer={fmtPaymentTimer}
          />
        )}

        {/* Fueling */}
        {!loading && fuelRequest && fueling && (
          <FuelingState fuelRequest={fuelRequest} completing={completing} onComplete={handleComplete} />
        )}

        {/* Failed */}
        {!loading && fuelRequest && failed && !confirmed && (
          <FailedState fuelRequest={fuelRequest} confirming={confirming} onSendCar={handleSendCar} />
        )}

        {/* Completed / confirmed */}
        {!loading && (completed || confirmed) && (
          <CompletedState confirmed={confirmed} />
        )}

      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <CancelModal
          cancelReason={cancelReason}
          cancelError={cancelError}
          cancelling={cancelling}
          onSelectReason={r => { setCancelReason(r); setCancelError(''); }}
          onCustomReason={t => setCancelReason(t || 'Other')}
          onConfirm={handleCancelRequest}
          onClose={() => { setShowCancelModal(false); setCancelReason(''); setCancelError(''); }}
        />
      )}
    </div>
  );
}