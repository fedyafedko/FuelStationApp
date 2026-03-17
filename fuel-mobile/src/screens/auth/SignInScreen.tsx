import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import type { SignInDTO } from '../../types/api.types';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export default function SignInScreen() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInDTO>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: SignInDTO) => {
    setAuthError(null);
    try {
      const res = await authApi.signIn(data);
      await setTokens(res.data.accessToken, res.data.refreshToken);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .signin-root {
          font-family: 'Sora', sans-serif;
          min-height: 100dvh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .bg-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .orb-1 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(251,146,60,0.16) 0%, transparent 70%);
          top: -80px; left: -40px;
          animation: drift1 9s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
          bottom: 40px; right: -50px;
          animation: drift2 11s ease-in-out infinite alternate;
        }
        .orb-3 {
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          animation: drift1 7s ease-in-out infinite alternate;
        }
        @keyframes drift1 { from { transform: translate(0,0); } to { transform: translate(25px,35px); } }
        @keyframes drift2 { from { transform: translate(0,0); } to { transform: translate(-20px,25px); } }

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

        .welcome-back {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(251,146,60,0.1);
          border: 1px solid rgba(251,146,60,0.22);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #fb923c; margin-bottom: 28px; width: fit-content;
          animation: slideUp 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #fb923c;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }

        .heading {
          font-size: clamp(28px, 7vw, 36px); font-weight: 700;
          color: #fff; line-height: 1.15; margin-bottom: 8px;
          letter-spacing: -0.02em;
          animation: slideUp 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both;
        }
        .heading span {
          background: linear-gradient(135deg, #fb923c 0%, #f43f5e 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .subheading {
          font-size: 14px; color: rgba(255,255,255,0.38); font-weight: 400;
          margin-bottom: 36px; line-height: 1.5;
          animation: slideUp 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) both;
        }

        .form { display: flex; flex-direction: column; gap: 18px; }

        .field-wrap {
          display: flex; flex-direction: column;
          animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .field-wrap:nth-child(1) { animation-delay: 0.25s; }
        .field-wrap:nth-child(2) { animation-delay: 0.3s; }

        .field-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
          margin-bottom: 8px; transition: color 0.2s;
          font-family: 'DM Mono', monospace;
        }
        .field-label.active { color: #fb923c; }

        .input-wrapper { position: relative; display: flex; align-items: center; }

        .field-icon {
          position: absolute; left: 16px;
          color: rgba(255,255,255,0.18); transition: color 0.2s;
          pointer-events: none; display: flex; align-items: center;
        }
        .field-icon.active { color: #fb923c; }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 15px 48px 15px 46px;
          font-size: 15px; font-family: 'Sora', sans-serif;
          color: #fff; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.18); }
        .field-input:focus {
          border-color: rgba(251,146,60,0.5);
          background: rgba(251,146,60,0.04);
          box-shadow: 0 0 0 4px rgba(251,146,60,0.08);
        }
        .field-input.has-error { border-color: rgba(244,63,94,0.5); background: rgba(244,63,94,0.04); }
        .field-input.has-error:focus { box-shadow: 0 0 0 4px rgba(244,63,94,0.08); }

        .pw-toggle {
          position: absolute; right: 14px;
          background: none; border: none;
          color: rgba(255,255,255,0.22); cursor: pointer;
          padding: 4px; display: flex; align-items: center;
          transition: color 0.2s; -webkit-tap-highlight-color: transparent;
        }
        .pw-toggle:hover { color: rgba(255,255,255,0.55); }

        .error-msg {
          font-size: 12px; color: #f87171; margin-top: 6px;
          display: flex; align-items: center; gap: 5px; font-weight: 500;
        }

        .forgot-row {
          display: flex; justify-content: flex-end;
          margin-top: -6px;
          animation: slideUp 0.6s 0.33s cubic-bezier(0.22,1,0.36,1) both;
        }
        .forgot-link {
          font-size: 12px; color: rgba(255,255,255,0.3);
          text-decoration: none; font-weight: 500;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #fb923c; }

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
        .auth-error-title {
          font-size: 13px; font-weight: 700; color: #f87171; margin-bottom: 3px;
        }
        .auth-error-msg {
          font-size: 12px; color: rgba(248,113,113,0.7); line-height: 1.5;
          word-break: break-word;
        }
        .auth-error-close {
          background: none; border: none; color: rgba(244,63,94,0.4);
          cursor: pointer; padding: 2px; display: flex; align-items: center;
          transition: color 0.2s; flex-shrink: 0; align-self: flex-start;
          -webkit-tap-highlight-color: transparent;
        }
        .auth-error-close:hover { color: #f43f5e; }

        .submit-btn {
          margin-top: 4px; width: 100%; padding: 17px;
          background: linear-gradient(135deg, #fb923c 0%, #f43f5e 100%);
          border: none; border-radius: 14px;
          font-size: 15px; font-family: 'Sora', sans-serif; font-weight: 600;
          color: #fff; cursor: pointer;
          position: relative; overflow: hidden;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 8px 32px rgba(251,146,60,0.25);
          -webkit-tap-highlight-color: transparent;
          animation: slideUp 0.6s 0.38s cubic-bezier(0.22,1,0.36,1) both;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.92; transform: translateY(-1px);
          box-shadow: 0 12px 40px rgba(251,146,60,0.35);
        }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .submit-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex; align-items: center; gap: 12px; margin-top: 4px;
          animation: slideUp 0.6s 0.43s cubic-bezier(0.22,1,0.36,1) both;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.18); font-weight: 500; }

        .signup-link {
          text-align: center; font-size: 14px; color: rgba(255,255,255,0.33);
          animation: slideUp 0.6s 0.48s cubic-bezier(0.22,1,0.36,1) both;
        }
        .signup-link a {
          color: #fb923c; text-decoration: none; font-weight: 600; transition: opacity 0.2s;
        }
        .signup-link a:hover { opacity: 0.75; }

        .trust-row {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          margin-top: 24px;
          animation: slideUp 0.6s 0.52s cubic-bezier(0.22,1,0.36,1) both;
        }
        .trust-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: rgba(255,255,255,0.2); font-weight: 500;
        }
      `}</style>

      <div className="signin-root">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />

        <div className="card">
          <div className="welcome-back">
            <span className="badge-dot" />
            Driver Portal
          </div>

          <h1 className="heading">Welcome<br /><span>back</span></h1>
          <p className="subheading">Sign in to continue your journey</p>

          <form onSubmit={handleSubmit(onSubmit)} className="form">
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
                  placeholder="Your password"
                  autoComplete="current-password"
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
                  <div className="auth-error-title">Sign in failed</div>
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
                  <><div className="spinner" /> Signing in…</>
                ) : (
                  <>Sign In
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

          <p className="signup-link" style={{ marginTop: '16px' }}>
            Don't have an account? <Link to="/sign-up">Sign Up</Link>
          </p>

          <div className="trust-row">
            <span className="trust-item">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Encrypted
            </span>
            <span className="trust-item">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Secure
            </span>
            <span className="trust-item">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Fast access
            </span>
          </div>
        </div>
      </div>
    </>
  );
}