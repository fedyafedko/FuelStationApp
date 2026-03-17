import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import type { SignUpDTO } from '../../types/api.types';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  role: z.string().min(1, 'Select role'),
});

export default function SignUpScreen() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpDTO>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Driver' },
  });

  const onSubmit: SubmitHandler<SignUpDTO> = async (data) => {
    setAuthError(null);
    try {
      const res = await authApi.signUp({ ...data, role: 'Driver' });
      await setTokens(res.data.accessToken, res.data.refreshToken);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) setAuthError(err.message);
      else setAuthError('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .signup-root {
          font-family: 'Sora', sans-serif;
          min-height: 100dvh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        .bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .orb-1 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 70%);
          top: -60px; right: -60px;
          animation: drift1 8s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
          bottom: 60px; left: -40px;
          animation: drift2 10s ease-in-out infinite alternate;
        }
        @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,30px) scale(1.1); } }
        @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-15px,20px) scale(0.9); } }

        .card {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          min-height: 100dvh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 40px 28px 48px;
          animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media (min-width: 480px) {
          .card {
            min-height: auto;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 28px;
            backdrop-filter: blur(24px);
            padding: 48px 40px;
            margin: 24px;
          }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(251,146,60,0.12); border: 1px solid rgba(251,146,60,0.25);
          border-radius: 100px; padding: 6px 14px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: #fb923c; margin-bottom: 28px; width: fit-content;
          animation: slideUp 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #fb923c;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

        .heading {
          font-size: clamp(28px, 7vw, 36px); font-weight: 700;
          color: #fff; line-height: 1.15; margin-bottom: 8px; letter-spacing: -0.02em;
          animation: slideUp 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both;
        }
        .heading span {
          background: linear-gradient(135deg, #fb923c 0%, #f43f5e 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .subheading {
          font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 400;
          margin-bottom: 36px; line-height: 1.5;
          animation: slideUp 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) both;
        }

        .form { display: flex; flex-direction: column; gap: 18px; }

        .field-wrap {
          display: flex; flex-direction: column; gap: 0; position: relative;
          animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .field-wrap:nth-child(1) { animation-delay: 0.25s; }
        .field-wrap:nth-child(2) { animation-delay: 0.3s; }
        .field-wrap:nth-child(3) { animation-delay: 0.35s; }

        .field-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 8px; transition: color 0.2s; font-family: 'DM Mono', monospace;
        }
        .field-label.active { color: #fb923c; }

        .input-wrapper { position: relative; display: flex; align-items: center; }

        .field-icon {
          position: absolute; left: 16px; color: rgba(255,255,255,0.2);
          transition: color 0.2s; pointer-events: none; display: flex; align-items: center;
        }
        .field-icon.active { color: #fb923c; }

        .field-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08); border-radius: 14px;
          padding: 15px 48px 15px 46px; font-size: 15px; font-family: 'Sora', sans-serif;
          font-weight: 400; color: #fff; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none; appearance: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus {
          border-color: rgba(251,146,60,0.5); background: rgba(251,146,60,0.04);
          box-shadow: 0 0 0 4px rgba(251,146,60,0.08);
        }
        .field-input.has-error { border-color: rgba(244,63,94,0.5); background: rgba(244,63,94,0.04); }
        .field-input.has-error:focus { box-shadow: 0 0 0 4px rgba(244,63,94,0.08); }

        .pw-toggle {
          position: absolute; right: 14px; background: none; border: none;
          color: rgba(255,255,255,0.25); cursor: pointer; padding: 4px;
          display: flex; align-items: center; transition: color 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .pw-toggle:hover { color: rgba(255,255,255,0.6); }

        .error-msg {
          font-size: 12px; color: #f87171; margin-top: 6px;
          display: flex; align-items: center; gap: 5px; font-weight: 500;
        }

        /* ── Auth error banner ── */
        .auth-error {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 14px 16px;
          background: rgba(244,63,94,0.08);
          border: 1px solid rgba(244,63,94,0.22);
          border-radius: 14px;
          animation: errorShake 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes errorShake {
          0%   { opacity: 0; transform: translateX(-6px); }
          40%  { transform: translateX(5px); }
          70%  { transform: translateX(-3px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .auth-error-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.2);
          display: flex; align-items: center; justify-content: center; color: #f43f5e;
          margin-top: 1px;
        }
        .auth-error-body { flex: 1; min-width: 0; }
        .auth-error-title { font-size: 13px; font-weight: 700; color: #f87171; margin-bottom: 3px; }
        .auth-error-msg { font-size: 12px; color: rgba(248,113,113,0.7); line-height: 1.5; word-break: break-word; }
        .auth-error-close {
          background: none; border: none; color: rgba(244,63,94,0.4);
          cursor: pointer; padding: 2px; display: flex; align-items: center;
          transition: color 0.2s; flex-shrink: 0; align-self: flex-start;
          -webkit-tap-highlight-color: transparent;
        }
        .auth-error-close:hover { color: #f43f5e; }

        .submit-btn {
          margin-top: 8px; width: 100%; padding: 17px;
          background: linear-gradient(135deg, #fb923c 0%, #f43f5e 100%);
          border: none; border-radius: 14px; font-size: 15px; font-family: 'Sora', sans-serif;
          font-weight: 600; color: #fff; cursor: pointer; letter-spacing: 0.01em;
          position: relative; overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 8px 32px rgba(251,146,60,0.25);
          -webkit-tap-highlight-color: transparent;
          animation: slideUp 0.6s 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 12px 40px rgba(251,146,60,0.35); }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .submit-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex; align-items: center; gap: 12px; margin-top: 4px;
          animation: slideUp 0.6s 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.2); font-weight: 500; }

        .signin-link {
          text-align: center; font-size: 14px; color: rgba(255,255,255,0.35);
          animation: slideUp 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .signin-link a { color: #fb923c; text-decoration: none; font-weight: 600; transition: opacity 0.2s; }
        .signin-link a:hover { opacity: 0.75; }

        .terms {
          text-align: center; font-size: 11px; color: rgba(255,255,255,0.18); line-height: 1.6;
          animation: slideUp 0.6s 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .terms a { color: rgba(255,255,255,0.35); text-decoration: underline; text-underline-offset: 2px; }
      `}</style>

      <div className="signup-root">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />

        <div className="card">
          <div className="badge">
            <span className="badge-dot" />
            Driver Portal
          </div>

          <h1 className="heading">
            Create your<br /><span>account</span>
          </h1>
          <p className="subheading">Join thousands of drivers already on the platform</p>

          <form onSubmit={handleSubmit(onSubmit)} className="form">
            {/* Name */}
            <div className="field-wrap">
              <label className={`field-label ${focusedField === 'name' ? 'active' : ''}`}>Full Name</label>
              <div className="input-wrapper">
                <span className={`field-icon ${focusedField === 'name' ? 'active' : ''}`}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  className={`field-input${errors.name ? ' has-error' : ''}`}
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  onFocus={() => setFocusedField('name')}
                  {...register('name')}
                />
              </div>
              {errors.name && (
                <p className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="field-wrap">
              <label className={`field-label ${focusedField === 'email' ? 'active' : ''}`}>Email Address</label>
              <div className="input-wrapper">
                <span className={`field-icon ${focusedField === 'email' ? 'active' : ''}`}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  className={`field-input${errors.email ? ' has-error' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  onFocus={() => setFocusedField('email')}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="field-wrap">
              <label className={`field-label ${focusedField === 'password' ? 'active' : ''}`}>Password</label>
              <div className="input-wrapper">
                <span className={`field-icon ${focusedField === 'password' ? 'active' : ''}`}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`field-input${errors.password ? ' has-error' : ''}`}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  onFocus={() => setFocusedField('password')}
                  {...register('password')}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword
                    ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {errors.password && (
                <p className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* ── Auth error banner ── */}
            {authError && (
              <div className="auth-error">
                <div className="auth-error-icon">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div className="auth-error-body">
                  <div className="auth-error-title">Sign up failed</div>
                  <div className="auth-error-msg">{authError}</div>
                </div>
                <button
                  type="button"
                  className="auth-error-close"
                  onClick={() => setAuthError(null)}
                  aria-label="Dismiss"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="submit-btn">
              <span className="btn-inner">
                {isSubmitting ? (
                  <><div className="spinner" /> Creating account…</>
                ) : (
                  <>Get Started
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="divider" style={{ marginTop: '24px' }}>
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          <p className="signin-link" style={{ marginTop: '16px' }}>
            Already have an account? <Link to="/sign-in">Sign In</Link>
          </p>

          <p className="terms" style={{ marginTop: '20px' }}>
            By signing up, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  );
}