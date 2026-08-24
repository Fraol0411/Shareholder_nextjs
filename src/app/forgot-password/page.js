/**
 * FORGOT PASSWORD PAGE — OTP-based password reset flow
 * ─────────────────────────────────────────────────────
 *
 * FLOW OVERVIEW:
 *   Step 1 — Request OTP:
 *     User enters their phone number (or username / reg_no).
 *     POST /api/auth/forgot-password  { identifier }
 *     → Server looks up the user, generates a 6-digit OTP,
 *       stores it (hashed) in the DB with a 10-minute TTL,
 *       and sends it to the user's registered phone via SMS.
 *
 *   Step 2 — Verify OTP:
 *     User enters the 6-digit code received by SMS.
 *     POST /api/auth/verify-otp  { identifier, otp }
 *     → Server validates the OTP and returns a short-lived
 *       reset token (signed JWT, 10-minute expiry).
 *
 *   Step 3 — Set new password:
 *     User enters and confirms a new password.
 *     POST /api/auth/reset-password  { resetToken, newPassword }
 *     → Server verifies the reset token, hashes the new password,
 *       updates the users table, and invalidates the OTP.
 *
 * DEPENDENCIES NEEDED (not yet installed):
 *   - SMS gateway SDK, e.g. Twilio: npm install twilio
 *     OR an Ethiopian carrier gateway (Ethio Telecom, Safaricom).
 *   - A method of storing OTPs — either:
 *       a) New DB table:  CREATE TABLE otp_requests (
 *                           id SERIAL PRIMARY KEY,
 *                           user_id INT REFERENCES users(id),
 *                           otp_hash TEXT NOT NULL,
 *                           expires_at TIMESTAMPTZ NOT NULL,
 *                           used BOOLEAN DEFAULT FALSE
 *                         );
 *       b) Redis with TTL (recommended for production).
 *
 * ENV VARIABLES REQUIRED:
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
 *   JWT_SECRET=...              (already used by login)
 *   OTP_RESET_SECRET=...        (separate secret for reset tokens)
 *
 * SECURITY NOTES:
 *   - Rate-limit /api/auth/forgot-password to prevent OTP flooding.
 *   - Never reveal whether a phone / identifier exists in the DB
 *     (always return the same success message to avoid enumeration).
 *   - OTP must be hashed (bcrypt or SHA-256) before storing.
 *   - Reset token must be single-use and expire in ≤15 minutes.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaPhone, FaShieldAlt, FaLock, FaArrowLeft,
  FaCheckCircle, FaEye, FaEyeSlash, FaExclamationCircle,
} from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';

const STEPS = { REQUEST: 1, VERIFY: 2, RESET: 3, DONE: 4 };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(STEPS.REQUEST);

  // Step 1
  const [identifier, setIdentifier] = useState('');
  // Step 2
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  // Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ── helpers ── */
  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  /* ── Step 1: request OTP ── */
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');
      startCooldown();
      setStep(STEPS.VERIFY);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 2: verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid or expired OTP.');
      setResetToken(data.resetToken);
      setStep(STEPS.RESET);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 2: resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP.');
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 3: reset password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password reset failed.');
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── shared input style ── */
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

  /* ── progress indicators ── */
  const stepLabels = ['Request', 'Verify', 'Reset'];
  const activeStep = Math.min(step - 1, 2); // clamp; step 4 = done

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-slate-50 font-sans dark:bg-slate-950">
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <FaArrowLeft className="text-xs" />
          Back to Login
        </button>
        <ThemeToggle />
      </div>

      {/* centered content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-8">
        <div className="w-full max-w-[420px]">

          {/* step progress */}
          {step < STEPS.DONE && (
            <div className="mb-8 flex items-center gap-0">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      i < activeStep ? 'bg-blue-600 text-white' :
                      i === activeStep ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' :
                      'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {i < activeStep ? '✓' : i + 1}
                    </div>
                    <span className={`mt-1 text-[10px] font-medium ${
                      i <= activeStep ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                    }`}>{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 mb-4 transition-colors ${
                      i < activeStep ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* error banner */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              <FaExclamationCircle className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* ── STEP 1: Request OTP ── */}
          {step === STEPS.REQUEST && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Forgot Password</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Enter your registered phone number. We&apos;ll send a verification code via SMS.
                </p>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Phone number / Username / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaPhone size={15} />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+251 9xx xxx xxx or username"
                    autoComplete="tel"
                    className={inputCls}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* ── STEP 2: Verify OTP ── */}
          {step === STEPS.VERIFY && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Enter Code</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  A 6-digit code was sent to your registered phone. It expires in 10 minutes.
                </p>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Verification code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaShieldAlt size={15} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="______"
                    className={`${inputCls} text-center tracking-[0.5em] font-mono text-lg`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : 'Verify Code'}
              </button>

              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                Didn&apos;t receive it?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className="font-bold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Set new password ── */}
          {step === STEPS.RESET && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">New Password</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Choose a strong password with at least 6 characters.
                </p>
              </div>

              {/* new password */}
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">New password</label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-600">
                    <FaLock size={15} />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${inputCls} pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showNew ? 'Hide password' : 'Show password'}>
                    {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* confirm password */}
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm password</label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-600">
                    <FaLock size={15} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${inputCls} pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                    {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : 'Set New Password'}
              </button>
            </form>
          )}

          {/* ── STEP 4: Done ── */}
          {step === STEPS.DONE && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <FaCheckCircle className="text-4xl text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Password Updated</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
