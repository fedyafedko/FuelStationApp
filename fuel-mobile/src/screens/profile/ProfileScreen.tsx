import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { type UserDTO, type CarDTO, type CreateCarDTO, FuelType, type UpdateCarDTO } from '../../types/api.types';
import { userApi } from '../../api/user.api';
import { carApi } from '../../api/car.api';

const FUEL_TYPES: { label: string; value: FuelType }[] = [
  { label: 'Petrol', value: FuelType.Petrol },
  { label: 'Diesel', value: FuelType.Diesel },
  { label: 'Gas',    value: FuelType.Gas    },
];

const FUEL_META: Record<FuelType, { label: string; color: string }> = {
  [FuelType.Petrol]: { label: 'Petrol', color: '#fb923c' },
  [FuelType.Diesel]: { label: 'Diesel', color: '#60a5fa' },
  [FuelType.Gas]:    { label: 'Gas',    color: '#34d399' },
};

const emptyForm: CreateCarDTO = {
  mark: '', model: '', engineCapacity: 0,
  carNumber: '', tankCapacity: 0,
  fuelType: FuelType.Petrol,
};

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  const [user, setUser]               = useState<UserDTO | null>(null);
  const [cars, setCars]               = useState<CarDTO[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCars, setLoadingCars] = useState(true);
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar]   = useState<CarDTO | null>(null);
  const [form, setForm]               = useState<CreateCarDTO>(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<'profile' | 'cars'>('profile');

  useEffect(() => { fetchUser(); fetchCars(); }, []);

  const fetchUser = async () => {
    try { const { data } = await userApi.getProfile(); setUser(data); }
    catch (e) { console.error(e); } finally { setLoadingUser(false); }
  };

  const fetchCars = async () => {
    try { const { data } = await carApi.getAll(); setCars(data); }
    catch (e) { console.error(e); } finally { setLoadingCars(false); }
  };

  const openAdd  = () => { setEditingCar(null); setForm(emptyForm); setShowCarModal(true); };
  const openEdit = (car: CarDTO) => {
    setEditingCar(car);
    setForm({ mark: car.mark, model: car.model, engineCapacity: car.engineCapacity, carNumber: car.carNumber, tankCapacity: car.tankCapacity, fuelType: car.fuelType });
    setShowCarModal(true);
  };

  const handleSaveCar = async () => {
    if (!form.mark || !form.model || !form.carNumber) return;
    setSaving(true);
    try {
      if (editingCar) {
        const { data } = await carApi.update(editingCar.id, form as UpdateCarDTO);
        setCars(cs => cs.map(c => c.id === editingCar.id ? data : c));
      } else {
        const { data } = await carApi.create(form);
        setCars(cs => [...cs, data]);
      }
      setShowCarModal(false);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDeleteCar = async (id: string) => {
    setDeletingId(id);
    try { await carApi.delete(id); setCars(cs => cs.filter(c => c.id !== id)); }
    catch (e) { console.error(e); } finally { setDeletingId(null); }
  };

  const handleLogout = async () => { await logout(); window.location.href = '/sign-in'; };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pr-root {
          font-family: 'Sora', sans-serif;
          min-height: 100dvh; background: #0a0a0f;
          display: flex; flex-direction: column; color: #fff;
        }

        /* header */
        .pr-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px;
          background: rgba(10,10,15,0.92); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0; z-index: 50;
        }
        .pr-back {
          width: 36px; height: 36px; border-radius: 11px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s; flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-back:hover { background: rgba(255,255,255,0.09); color: #fff; }
        .pr-header-title { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; flex: 1; }
        .pr-logout-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.18);
          color: rgba(244,63,94,0.8); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: 'Sora', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-logout-btn:hover { background: rgba(244,63,94,0.14); color: #f43f5e; }

        /* body */
        .pr-body { flex: 1; overflow-y: auto; padding-bottom: 48px; }
        .pr-body::-webkit-scrollbar { width: 0; }

        /* hero */
        .pr-hero {
          margin: 20px 20px 0;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 24px 20px;
          display: flex; align-items: center; gap: 16px;
          animation: slideUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }

        .pr-avatar {
          width: 64px; height: 64px; border-radius: 18px; flex-shrink: 0;
          background: linear-gradient(135deg, #fb923c, #f43f5e);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #fff;
          box-shadow: 0 8px 24px rgba(251,146,60,0.3);
        }
        .pr-avatar-skeleton {
          width: 64px; height: 64px; border-radius: 18px;
          background: rgba(255,255,255,0.06); animation: shimmer 1.5s infinite; flex-shrink: 0;
        }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }

        .pr-user-info { flex: 1; min-width: 0; }
        .pr-user-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pr-user-email { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pr-role-badge {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 8px; padding: 4px 10px; border-radius: 100px;
          background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.22);
          font-size: 10px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; color: #fb923c; font-family: 'DM Mono', monospace;
        }
        .role-dot { width: 5px; height: 5px; border-radius: 50%; background: #fb923c; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

        /* tabs */
        .pr-tabs {
          display: flex; gap: 6px; margin: 20px 20px 0;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 4px;
          animation: slideUp 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both;
        }
        .pr-tab {
          flex: 1; padding: 10px; border-radius: 10px;
          font-size: 13px; font-weight: 600; font-family: 'Sora', sans-serif;
          color: rgba(255,255,255,0.35); cursor: pointer; border: none;
          background: none; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-tab.active { background: rgba(255,255,255,0.07); color: #fff; }
        .pr-tab-count {
          background: rgba(251,146,60,0.15); border: 1px solid rgba(251,146,60,0.2);
          border-radius: 100px; padding: 1px 7px; font-size: 10px; color: #fb923c;
          font-family: 'DM Mono', monospace;
        }

        /* section */
        .pr-section { margin: 16px 20px 0; animation: slideUp 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both; }
        .pr-section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
          font-family: 'DM Mono', monospace; margin-bottom: 10px; padding-left: 2px;
        }

        /* info card */
        .pr-info-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; overflow: hidden;
        }
        .pr-info-row {
          display: flex; align-items: center; gap: 14px; padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .pr-info-row:last-child { border-bottom: none; }
        .pr-info-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.35);
        }
        .pr-info-label { font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'DM Mono', monospace; letter-spacing: 0.04em; }
        .pr-info-value { font-size: 14px; font-weight: 500; color: #fff; margin-top: 2px; }

        /* car cards */
        .pr-cars-list { display: flex; flex-direction: column; gap: 10px; }
        .pr-car-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 14px 12px 14px 14px;
          display: flex; align-items: center; gap: 12px;
          transition: border-color 0.2s, background 0.2s;
          animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .pr-car-card:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); }

        .pr-car-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3);
        }
        .pr-car-info { flex: 1; min-width: 0; }
        .pr-car-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pr-car-meta { display: flex; align-items: center; gap: 6px; margin-top: 5px; flex-wrap: wrap; }
        .pr-plate {
          padding: 2px 8px; border-radius: 5px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.45); font-family: 'DM Mono', monospace;
        }
        .pr-fuel-tag {
          padding: 2px 8px; border-radius: 5px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.05em;
          font-family: 'DM Mono', monospace;
        }
        .pr-car-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .pr-car-btn {
          width: 32px; height: 32px; border-radius: 9px; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .pr-car-btn.edit { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
        .pr-car-btn.edit:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .pr-car-btn.del  { background: rgba(244,63,94,0.07); color: rgba(244,63,94,0.5); }
        .pr-car-btn.del:hover  { background: rgba(244,63,94,0.14); color: #f43f5e; }
        .pr-car-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* add car */
        .pr-add-car {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px;
          background: rgba(251,146,60,0.06); border: 1.5px dashed rgba(251,146,60,0.22);
          border-radius: 16px; font-size: 14px; font-weight: 600; font-family: 'Sora', sans-serif;
          color: rgba(251,146,60,0.7); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-add-car:hover { background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.4); color: #fb923c; }

        /* empty */
        .pr-empty {
          text-align: center; padding: 36px 20px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;
        }
        .pr-empty-icon {
          width: 52px; height: 52px; border-radius: 16px; margin: 0 auto 14px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.2);
        }
        .pr-empty-title { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.5); }
        .pr-empty-sub   { font-size: 13px; color: rgba(255,255,255,0.25); margin-top: 4px; }

        /* modal */
        .pr-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px); z-index: 200;
          display: flex; align-items: flex-end; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @media (min-width: 480px) { .pr-modal-overlay { align-items: center; } .pr-modal { border-radius: 24px !important; margin: 16px; } }

        .pr-modal {
          width: 100%; max-width: 480px;
          background: #0e0e15; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px 24px 0 0; padding: 20px 24px 40px;
          animation: sheetUp 0.3s cubic-bezier(0.22,1,0.36,1);
          max-height: 92dvh; overflow-y: auto;
        }
        .pr-modal::-webkit-scrollbar { width: 0; }
        @keyframes sheetUp { from{transform:translateY(40px);opacity:0} to{transform:none;opacity:1} }

        .pr-modal-handle { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); margin: 0 auto 20px; }
        .pr-modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .pr-modal-icon {
          width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #fb923c, #f43f5e);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(251,146,60,0.3);
        }
        .pr-modal-title { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
        .pr-modal-sub   { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 2px; }

        /* form */
        .pr-form { display: flex; flex-direction: column; gap: 14px; }
        .pr-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pr-field { display: flex; flex-direction: column; gap: 7px; }
        .pr-field-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; color: rgba(255,255,255,0.28);
          font-family: 'DM Mono', monospace;
        }
        .pr-field-input, .pr-field-select {
          background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 12px 14px;
          font-size: 14px; font-family: 'Sora', sans-serif; color: #fff; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none; width: 100%;
        }
        .pr-field-input::placeholder { color: rgba(255,255,255,0.18); }
        .pr-field-input:focus, .pr-field-select:focus {
          border-color: rgba(251,146,60,0.5); background: rgba(251,146,60,0.04);
          box-shadow: 0 0 0 4px rgba(251,146,60,0.08);
        }

        /* fuel type toggle */
        .fuel-toggle { display: flex; gap: 8px; }
        .fuel-opt {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 10px 6px; border-radius: 12px; cursor: pointer; border: none;
          background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.07);
          transition: all 0.18s; -webkit-tap-highlight-color: transparent; font-family: 'Sora', sans-serif;
        }
        .fuel-opt:active { transform: scale(0.95); }
        .fuel-opt-dot { width: 8px; height: 8px; border-radius: 50%; }
        .fuel-opt-label { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; font-family: 'DM Mono', monospace; }

        .pr-modal-actions { display: flex; gap: 10px; margin-top: 8px; }
        .pr-btn-primary {
          flex: 1; padding: 15px;
          background: linear-gradient(135deg, #fb923c, #f43f5e); border: none; border-radius: 13px;
          font-size: 14px; font-family: 'Sora', sans-serif; font-weight: 600; color: #fff;
          cursor: pointer; box-shadow: 0 8px 24px rgba(251,146,60,0.25);
          transition: opacity 0.2s, transform 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .pr-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .pr-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .pr-btn-secondary {
          padding: 15px 18px;
          background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 13px; font-size: 14px; font-family: 'Sora', sans-serif; font-weight: 600;
          color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-btn-secondary:hover { background: rgba(255,255,255,0.09); color: #fff; }

        .btn-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .skeleton-line { border-radius: 6px; background: rgba(255,255,255,0.06); animation: shimmer 1.5s infinite; }
      `}</style>

      <div className="pr-root">

        {/* ── Header ── */}
        <header className="pr-header">
          <button className="pr-back" onClick={() => window.history.back()}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="pr-header-title">My Profile</span>
          <button className="pr-logout-btn" onClick={handleLogout}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
            Sign Out
          </button>
        </header>

        <div className="pr-body">

          {/* ── Hero ── */}
          <div className="pr-hero">
            {loadingUser
              ? <div className="pr-avatar-skeleton" />
              : <div className="pr-avatar">{initials}</div>
            }
            <div className="pr-user-info">
              {loadingUser ? (
                <>
                  <div className="skeleton-line" style={{ width: '60%', height: 18, marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: '80%', height: 13 }} />
                </>
              ) : (
                <>
                  <div className="pr-user-name">{user?.name}</div>
                  <div className="pr-user-email">{user?.email}</div>
                  {user?.role && (
                    <div className="pr-role-badge">
                      <span className="role-dot" />{user.role}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="pr-tabs">
            <button className={`pr-tab${activeTab === 'profile' ? ' active' : ''}`} onClick={() => setActiveTab('profile')}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </button>
            <button className={`pr-tab${activeTab === 'cars' ? ' active' : ''}`} onClick={() => setActiveTab('cars')}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
              </svg>
              Vehicles
              {cars.length > 0 && <span className="pr-tab-count">{cars.length}</span>}
            </button>
          </div>

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <div className="pr-section">
              <div className="pr-section-label">Account Details</div>
              <div className="pr-info-card">
                {[
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
                    label: 'Full Name', value: user?.name,
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                    label: 'Email', value: user?.email,
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
                    label: 'Role', value: user?.role ?? 'Driver',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />,
                    label: 'User ID', value: user?.id, mono: true,
                  },
                ].map(({ icon, label, value, mono }) => (
                  <div className="pr-info-row" key={label}>
                    <div className="pr-info-icon">
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{icon}</svg>
                    </div>
                    <div>
                      <div className="pr-info-label">{label}</div>
                      {loadingUser
                        ? <div className="skeleton-line" style={{ width: 120, height: 15, marginTop: 4 }} />
                        : <div className="pr-info-value" style={mono ? { fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.38)', wordBreak: 'break-all' } : {}}>{value ?? '—'}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Vehicles tab ── */}
          {activeTab === 'cars' && (
            <div className="pr-section">
              <div className="pr-section-label">My Vehicles</div>
              <div className="pr-cars-list">
                {loadingCars ? (
                  [1, 2].map(i => (
                    <div key={i} className="pr-car-card">
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton-line" style={{ width: '55%', height: 14, marginBottom: 8 }} />
                        <div className="skeleton-line" style={{ width: '35%', height: 11 }} />
                      </div>
                    </div>
                  ))
                ) : cars.length === 0 ? (
                  <div className="pr-empty">
                    <div className="pr-empty-icon">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                      </svg>
                    </div>
                    <div className="pr-empty-title">No vehicles yet</div>
                    <div className="pr-empty-sub">Add your first car to get started</div>
                  </div>
                ) : (
                  cars.map((car, i) => {
                    const meta = FUEL_META[car.fuelType as FuelType] ?? FUEL_META[FuelType.Petrol];
                    return (
                      <div key={car.id} className="pr-car-card" style={{ animationDelay: `${i * 0.06}s` }}>
                        <div className="pr-car-icon">
                          <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                            <circle cx="7.5" cy="16" r="1.2" fill="rgba(255,255,255,0.35)" stroke="none" />
                            <circle cx="16.5" cy="16" r="1.2" fill="rgba(255,255,255,0.35)" stroke="none" />
                          </svg>
                        </div>
                        <div className="pr-car-info">
                          <div className="pr-car-name">{car.mark} {car.model}</div>
                          <div className="pr-car-meta">
                            <span className="pr-plate">{car.carNumber}</span>
                            <span className="pr-fuel-tag" style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30`, color: meta.color }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'DM Mono',monospace" }}>
                              {car.tankCapacity}L · {car.engineCapacity}cc
                            </span>
                          </div>
                        </div>
                        <div className="pr-car-actions">
                          <button className="pr-car-btn edit" onClick={() => openEdit(car)} title="Edit">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button className="pr-car-btn del" onClick={() => handleDeleteCar(car.id)} disabled={deletingId === car.id} title="Delete">
                            {deletingId === car.id
                              ? <span className="btn-spinner" style={{ width: 12, height: 12, marginRight: 0 }} />
                              : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                <button className="pr-add-car" onClick={openAdd}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Vehicle
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Car Modal ── */}
      {showCarModal && (
        <div className="pr-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCarModal(false); }}>
          <div className="pr-modal">
            <div className="pr-modal-handle" />
            <div className="pr-modal-header">
              <div className="pr-modal-icon">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                  <circle cx="7.5" cy="16" r="1.2" fill="white" stroke="none" />
                  <circle cx="16.5" cy="16" r="1.2" fill="white" stroke="none" />
                </svg>
              </div>
              <div>
                <div className="pr-modal-title">{editingCar ? 'Edit Vehicle' : 'Add Vehicle'}</div>
                <div className="pr-modal-sub">{editingCar ? 'Update car details' : 'Register a new car'}</div>
              </div>
            </div>

            <div className="pr-form">
              <div className="pr-form-row">
                <div className="pr-field">
                  <label className="pr-field-label">Make</label>
                  <input className="pr-field-input" placeholder="Toyota" value={form.mark}
                    onChange={e => setForm(f => ({ ...f, mark: e.target.value }))} />
                </div>
                <div className="pr-field">
                  <label className="pr-field-label">Model</label>
                  <input className="pr-field-input" placeholder="Camry" value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                </div>
              </div>

              <div className="pr-field">
                <label className="pr-field-label">License Plate</label>
                <input
                  className="pr-field-input"
                  placeholder="AA 1234 BB"
                  value={form.carNumber}
                  onChange={e => setForm(f => ({ ...f, carNumber: e.target.value }))}
                  style={{ fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}
                />
              </div>

              <div className="pr-form-row">
                <div className="pr-field">
                  <label className="pr-field-label">Engine (cc)</label>
                  <input className="pr-field-input" type="number" placeholder="1998"
                    value={form.engineCapacity || ''}
                    onChange={e => setForm(f => ({ ...f, engineCapacity: Number(e.target.value) }))} />
                </div>
                <div className="pr-field">
                  <label className="pr-field-label">Tank (L)</label>
                  <input className="pr-field-input" type="number" placeholder="60"
                    value={form.tankCapacity || ''}
                    onChange={e => setForm(f => ({ ...f, tankCapacity: Number(e.target.value) }))} />
                </div>
              </div>

              {/* ── Fuel type toggle ── */}
              <div className="pr-field">
                <label className="pr-field-label">Fuel Type</label>
                <div className="fuel-toggle">
                  {FUEL_TYPES.map(ft => {
                    const isActive = form.fuelType === ft.value;
                    const { color } = FUEL_META[ft.value];
                    return (
                      <button
                        key={ft.value}
                        type="button"
                        className="fuel-opt"
                        onClick={() => setForm(f => ({ ...f, fuelType: ft.value }))}
                        style={isActive ? {
                          background: `${color}15`,
                          borderColor: `${color}50`,
                          color,
                          boxShadow: `0 0 0 3px ${color}12`,
                        } : { color: 'rgba(255,255,255,0.3)' }}
                      >
                        <span className="fuel-opt-dot" style={{ background: isActive ? color : 'rgba(255,255,255,0.15)' }} />
                        <span className="fuel-opt-label">{ft.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pr-modal-actions" style={{ marginTop: 20 }}>
              <button className="pr-btn-secondary" onClick={() => setShowCarModal(false)}>Cancel</button>
              <button className="pr-btn-primary" onClick={handleSaveCar} disabled={saving}>
                {saving
                  ? <><span className="btn-spinner" />{editingCar ? 'Saving…' : 'Adding…'}</>
                  : editingCar ? 'Save Changes' : 'Add Vehicle'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}