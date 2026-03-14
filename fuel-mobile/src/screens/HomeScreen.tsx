import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import UserLocationMap from '../components/UserLocationMap';
import type { CarDTO, CreateFuelRequestDTO } from '../types/api.types';
import axiosInstance from '../api/axiosInstance';
import CarSelect from '../components/CarSelect';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_LOCATION = { latitude: 50.447925998975954, longitude: 30.452488349831874 };

interface PickedLocation { latitude: number; longitude: number }

function LocationPickerMap({ value, onChange }: { value: PickedLocation; onChange: (loc: PickedLocation) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [value.latitude, value.longitude],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:linear-gradient(135deg,#fb923c,#f43f5e);
        transform:rotate(-45deg);
        box-shadow:0 4px 16px rgba(251,146,60,0.5);
        border:2px solid white;
      "></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const marker = L.marker([value.latitude, value.longitude], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      onChange({ latitude: lat, longitude: lng });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange({ latitude: lat, longitude: lng });
    });

    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const goToCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        onChange(loc);
        mapRef.current?.setView([loc.latitude, loc.longitude], 16);
        markerRef.current?.setLatLng([loc.latitude, loc.longitude]);
      },
      () => alert('Could not get your location'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.1)' }}>
      <div ref={containerRef} style={{ height: 240, width: '100%' }} />

      {/* Current location btn */}
      <button
        type="button"
        onClick={goToCurrentLocation}
        style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 500,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(14,14,21,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100,
          padding: '8px 14px', color: '#fff', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Sora, sans-serif',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,146,60,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(14,14,21,0.92)')}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fb923c" strokeWidth="2.2">
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
        </svg>
        Use my location
      </button>

      {/* Hint */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(14,14,21,0.85)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100,
        padding: '5px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)',
        whiteSpace: 'nowrap', zIndex: 500, fontFamily: 'Sora, sans-serif',
        pointerEvents: 'none',
      }}>
        Tap map or drag pin to set location
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const logout = useAuthStore((s) => s.logout);

  const [showFuelModal, setShowFuelModal]       = useState(false);
  const [cars, setCars]                         = useState<CarDTO[]>([]);
  const [selectedCarId, setSelectedCarId]       = useState<string>('');
  const [requestedLiters, setRequestedLiters]   = useState<number>(0);
  const [loading, setLoading]                   = useState(false);
  const [showUserMenu, setShowUserMenu]         = useState(false);
  const [location, setLocation]                 = useState<PickedLocation>(DEFAULT_LOCATION);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [step, setStep]                         = useState<1 | 2>(1); // modal steps

  const handleLogout = async () => { await logout(); window.location.href = '/sign-in'; };

  const fetchCars = async () => {
    try {
      const { data } = await axiosInstance.get<CarDTO[]>('/api/car');
      setCars(data);
      if (data.length) setSelectedCarId(data[0].id);
    } catch { alert('Failed to load vehicles'); }
  };

  const openModal = () => { fetchCars(); setStep(1); setShowFuelModal(true); };

  const handleCreateFuelRequest = async () => {
    if (!selectedCarId || requestedLiters <= 0) return;
    setLoading(true);
    try {
      const body: CreateFuelRequestDTO = { carId: selectedCarId, requestedLiters, location };
      const { data } = await axiosInstance.post('/api/fuel-request', body);
      setShowFuelModal(false);
      window.location.href = `/fuel-request-waiting/${data.id}`;
    } catch { alert('Failed to create order'); }
    finally { setLoading(false); }
  };

  const coordLabel = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  const isDefaultLoc = location.latitude === DEFAULT_LOCATION.latitude && location.longitude === DEFAULT_LOCATION.longitude;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          font-family: 'Sora', sans-serif; min-height: 100dvh; background: #0a0a0f;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }

        /* header */
        .header {
          position: relative; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: rgba(10,10,15,0.88); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .header-logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #fb923c, #f43f5e);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(251,146,60,0.3);
        }
        .logo-text { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .logo-text span {
          background: linear-gradient(135deg, #fb923c, #f43f5e);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .header-actions { display: flex; align-items: center; gap: 10px; }
        .avatar-btn {
          width: 38px; height: 38px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(251,146,60,0.2), rgba(244,63,94,0.2));
          border: 1.5px solid rgba(251,146,60,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #fb923c; cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .avatar-btn:hover { border-color: rgba(251,146,60,0.6); }
        .user-menu {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #13131a; border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px; padding: 8px; min-width: 180px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          animation: dropIn 0.2s cubic-bezier(0.22,1,0.36,1); z-index: 100;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:none} }
        .menu-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6);
          cursor: pointer; transition: all 0.15s; border: none; background: none;
          width: 100%; text-align: left; -webkit-tap-highlight-color: transparent;
          font-family: 'Sora', sans-serif;
        }
        .menu-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .menu-item.danger { color: rgba(244,63,94,0.7); }
        .menu-item.danger:hover { background: rgba(244,63,94,0.1); color: #f43f5e; }
        .menu-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }

        /* map */
        .map-wrapper { flex: 1; position: relative; min-height: 0; }
        .map-wrapper > * { height: 100% !important; min-height: 300px; }
        .map-overlay-top {
          position: absolute; top: 14px; left: 14px; right: 14px;
          display: flex; justify-content: space-between; align-items: flex-start;
          z-index: 10; pointer-events: none;
        }
        .location-pill {
          display: flex; align-items: center; gap: 7px;
          background: rgba(10,10,15,0.85); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 100px;
          padding: 7px 13px; pointer-events: auto;
        }
        .location-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
          animation: pulseGreen 2s ease-in-out infinite;
        }
        @keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,0.2)} 50%{box-shadow:0 0 0 7px rgba(34,197,94,0.06)} }
        .location-text { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.7); }

        /* bottom sheet */
        .bottom-sheet {
          position: relative; z-index: 20; background: #0e0e15;
          border-top: 1px solid rgba(255,255,255,0.07); padding: 20px 20px 32px;
        }
        .sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); margin: 0 auto 20px; }
        .quick-actions { display: flex; flex-direction: column; gap: 10px; }

        .action-card {
          display: flex; align-items: center; gap: 12px; padding: 16px;
          border-radius: 16px; border: 1.5px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent; text-align: left; width: 100%;
          font-family: 'Sora', sans-serif;
        }
        .action-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }
        .action-card:active { transform: scale(0.98); }
        .action-card.primary {
          background: linear-gradient(135deg, rgba(251,146,60,0.12), rgba(244,63,94,0.08));
          border-color: rgba(251,146,60,0.25);
        }
        .action-card.primary:hover { border-color: rgba(251,146,60,0.45); background: linear-gradient(135deg,rgba(251,146,60,0.18),rgba(244,63,94,0.12)); }
        .action-icon {
          width: 42px; height: 42px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .action-icon.orange { background: linear-gradient(135deg,#fb923c,#f43f5e); box-shadow: 0 4px 16px rgba(251,146,60,0.3); }
        .action-icon.muted  { background: rgba(255,255,255,0.07); }
        .action-texts { flex: 1; }
        .action-label { font-size: 14px; font-weight: 700; color: #fff; }
        .action-sub   { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; font-family: 'DM Mono', monospace; }
        .chevron-right { color: rgba(255,255,255,0.2); flex-shrink: 0; }

        /* modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.72); backdrop-filter: blur(8px);
          display: flex; align-items: flex-end; justify-content: center; z-index: 200;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @media (min-width: 480px) { .modal-overlay{align-items:center} .modal-sheet{border-radius:24px!important;margin:16px} }
        .modal-sheet {
          width: 100%; max-width: 500px; background: #0e0e15;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 24px 24px 0 0;
          padding: 20px 24px 40px; animation: sheetUp 0.3s cubic-bezier(0.22,1,0.36,1);
          max-height: 92dvh; overflow-y: auto;
        }
        .modal-sheet::-webkit-scrollbar { width: 0; }
        @keyframes sheetUp { from{transform:translateY(40px);opacity:0} to{transform:none;opacity:1} }

        .modal-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); margin: 0 auto 20px; }
        .modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .modal-icon {
          width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg,#fb923c,#f43f5e);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(251,146,60,0.3);
        }
        .modal-title { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .modal-sub   { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 2px; }

        /* step indicator */
        .step-indicator { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
        .step-dot {
          flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .step-dot.active { background: linear-gradient(90deg,#fb923c,#f43f5e); }

        .modal-form { display: flex; flex-direction: column; gap: 18px; }
        .modal-field-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
          margin-bottom: 8px; font-family: 'DM Mono', monospace;
        }

        /* liters */
        .liters-row { display: flex; align-items: center; gap: 10px; }
        .liters-btn {
          width: 48px; height: 48px; border-radius: 13px; flex-shrink: 0;
          background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6); font-size: 22px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; -webkit-tap-highlight-color: transparent;
          font-family: 'Sora', sans-serif;
        }
        .liters-btn:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.15); }
        .liters-btn:active { transform: scale(0.91); }
        .liters-input {
          flex: 1; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 13px; padding: 13px 14px; font-size: 20px; font-weight: 700;
          font-family: 'DM Mono', monospace; color: #fff; outline: none; text-align: center;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .liters-input:focus { border-color: rgba(251,146,60,0.5); background: rgba(251,146,60,0.04); box-shadow: 0 0 0 4px rgba(251,146,60,0.08); }

        /* quick liters presets */
        .liters-presets { display: flex; gap: 7px; margin-top: 10px; flex-wrap: wrap; }
        .liters-preset {
          padding: 6px 14px; border-radius: 100px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.4);
          cursor: pointer; transition: all 0.15s; font-family: 'DM Mono', monospace;
          -webkit-tap-highlight-color: transparent;
        }
        .liters-preset:hover { background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.3); color: #fb923c; }
        .liters-preset.active { background: rgba(251,146,60,0.12); border-color: rgba(251,146,60,0.35); color: #fb923c; }

        /* location row */
        .loc-row {
          display: flex; align-items: center; gap: 10px; padding: 13px 14px;
          background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 13px; cursor: pointer; transition: all 0.18s;
          -webkit-tap-highlight-color: transparent;
        }
        .loc-row:hover { border-color: rgba(251,146,60,0.35); background: rgba(251,146,60,0.05); }
        .loc-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.2);
          display: flex; align-items: center; justify-content: center; color: #fb923c;
        }
        .loc-texts { flex: 1; min-width: 0; }
        .loc-title { font-size: 13px; font-weight: 600; color: #fff; }
        .loc-coord {
          font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 2px;
          font-family: 'DM Mono', monospace; letter-spacing: 0.04em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .loc-change {
          font-size: 11px; font-weight: 600; color: #fb923c; flex-shrink: 0;
          font-family: 'DM Mono', monospace; letter-spacing: 0.04em;
        }

        /* order summary */
        .summary-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden; margin-bottom: 4px;
        }
        .summary-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-key { font-size: 12px; color: rgba(255,255,255,0.35); font-family: 'DM Mono', monospace; }
        .summary-val { font-size: 13px; font-weight: 600; color: #fff; }

        /* modal actions */
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .modal-btn-primary {
          flex: 1; padding: 16px; background: linear-gradient(135deg,#fb923c,#f43f5e);
          border: none; border-radius: 14px; font-size: 15px; font-family: 'Sora',sans-serif;
          font-weight: 600; color: #fff; cursor: pointer;
          box-shadow: 0 8px 24px rgba(251,146,60,0.25);
          transition: opacity 0.2s, transform 0.15s; -webkit-tap-highlight-color: transparent;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .modal-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .modal-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .modal-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .modal-btn-secondary {
          padding: 16px 20px; background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08); border-radius: 14px;
          font-size: 15px; font-family: 'Sora',sans-serif; font-weight: 600;
          color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .modal-btn-secondary:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .btn-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="home-root">

        {/* Header */}
        <header className="header">
          <div className="header-logo">
            <div className="logo-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="logo-text">Fuel<span>Station</span></span>
          </div>

          <div className="header-actions" style={{ position: 'relative' }}>
            <button className="avatar-btn" onClick={() => setShowUserMenu(v => !v)} title="Account">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            {showUserMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowUserMenu(false)} />
                <div className="user-menu">
                  <button className="menu-item" onClick={() => { setShowUserMenu(false); window.location.href = '/profile'; }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item danger" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Map */}
        <div className="map-wrapper">
          <UserLocationMap height="100%" />
          <div className="map-overlay-top">
            <div className="location-pill">
              <div className="location-dot" />
              <span className="location-text">Kyiv, Ukraine</span>
            </div>
          </div>
        </div>

        {/* Bottom sheet */}
        <div className="bottom-sheet">
          <div className="sheet-handle" />
          <div className="quick-actions">
            <button className="action-card primary" onClick={openModal}>
              <div className="action-icon orange">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="action-texts">
                <div className="action-label">Order Fuel</div>
                <div className="action-sub">Deliver to my location</div>
              </div>
              <svg className="chevron-right" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="action-card" onClick={() => window.location.href = '/history'}>
              <div className="action-icon muted">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="action-texts">
                <div className="action-label">History</div>
                <div className="action-sub">Past orders</div>
              </div>
              <svg className="chevron-right" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Fuel Order Modal ── */}
      {showFuelModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowFuelModal(false); }}>
          <div className="modal-sheet">
            <div className="modal-handle" />

            {/* Header */}
            <div className="modal-header">
              <div className="modal-icon">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="modal-title">{step === 1 ? 'Order Fuel' : 'Confirm Order'}</div>
                <div className="modal-sub">{step === 1 ? 'Choose vehicle & amount' : 'Review before confirming'}</div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="step-indicator">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
            </div>

            {/* ── Step 1: vehicle + liters + location ── */}
            {step === 1 && (
              <div className="modal-form">
                <div>
                  <div className="modal-field-label">Vehicle</div>
                  <CarSelect cars={cars} value={selectedCarId} onChange={setSelectedCarId} />
                </div>

                <div>
                  <div className="modal-field-label">Liters</div>
                  <div className="liters-row">
                    <button type="button" className="liters-btn" onClick={() => setRequestedLiters(v => Math.max(0, v - 5))}>−</button>
                    <input
                      type="number"
                      className="liters-input"
                      value={requestedLiters || ''}
                      onChange={(e) => setRequestedLiters(Number(e.target.value))}
                      placeholder="0"
                    />
                    <button type="button" className="liters-btn" onClick={() => setRequestedLiters(v => v + 5)}>+</button>
                  </div>
                  <div className="liters-presets">
                    {[10, 20, 30, 50, 'Full'].map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`liters-preset${requestedLiters === p ? ' active' : ''}`}
                        onClick={() => typeof p === 'number' && setRequestedLiters(p)}
                      >
                        {typeof p === 'number' ? `${p}L` : p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="modal-field-label">Delivery Location</div>
                  <div className="loc-row" onClick={() => setShowLocationPicker(v => !v)}>
                    <div className="loc-icon">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="loc-texts">
                      <div className="loc-title">{isDefaultLoc ? 'Current location' : 'Custom location'}</div>
                      <div className="loc-coord">{coordLabel}</div>
                    </div>
                    <span className="loc-change">{showLocationPicker ? 'CLOSE ↑' : 'CHANGE →'}</span>
                  </div>

                  {showLocationPicker && (
                    <div style={{ marginTop: 10 }}>
                      <LocationPickerMap
                        value={location}
                        onChange={(loc) => setLocation(loc)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: summary ── */}
            {step === 2 && (
            <div>
              <div className="summary-card">
                {(() => {
                  const car = cars.find(c => c.id === selectedCarId);
                  const price = requestedLiters * 50;
                  return (
                    <>
                      <div className="summary-row">
                        <span className="summary-key">Vehicle</span>
                        <span className="summary-val">{car ? `${car.mark} ${car.model}` : '—'}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-key">Plate</span>
                        <span className="summary-val" style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em' }}>{car?.carNumber ?? '—'}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-key">Amount</span>
                        <span className="summary-val" style={{ color: '#fb923c' }}>{requestedLiters} L</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-key">Price</span>
                        <span className="summary-val" style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <span style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.3)',
                            fontFamily: "'DM Mono',monospace",
                          }}>
                            {requestedLiters} × ₴50
                          </span>
                          <span style={{
                            background: 'linear-gradient(135deg, #fb923c, #f43f5e)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', fontWeight: 700, fontSize: 16,
                          }}>
                            ₴{price.toLocaleString()}
                          </span>
                        </span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-key">Location</span>
                        <span className="summary-val" style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{coordLabel}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* mini map preview */}
              <div style={{ marginTop: 12 }}>
                <LocationPickerMap value={location} onChange={setLocation} />
              </div>
            </div>
          )}

            {/* Actions */}
            <div className="modal-actions">
              <button
                className="modal-btn-secondary"
                onClick={() => step === 1 ? setShowFuelModal(false) : setStep(1)}
              >
                {step === 1 ? 'Cancel' : '← Back'}
              </button>

              {step === 1 ? (
                <button
                  className="modal-btn-primary"
                  disabled={!selectedCarId || requestedLiters <= 0}
                  onClick={() => setStep(2)}
                >
                  Review Order
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  className="modal-btn-primary"
                  onClick={handleCreateFuelRequest}
                  disabled={loading}
                >
                  {loading ? <><span className="btn-spinner" /> Creating…</> : <>Confirm Order ⚡</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}