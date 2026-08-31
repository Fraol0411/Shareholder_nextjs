'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaLock, FaArrowLeft, FaIdCard,
  FaCheckCircle, FaEye, FaEyeSlash, FaExclamationCircle,
} from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';

const STEPS = { NATIONAL_ID: 1, SET_PASSWORD: 2, DONE: 3 };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(STEPS.NATIONAL_ID);

  // Step 1 — National ID
  const [nationalId, setNationalId] = useState('');
  // Step 2 — New password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Step 1: Verify National ID ── */
  const handleCheckNationalId = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'No account found with this National ID.');
      }

      // User exists — proceed to set new password
      setStep(STEPS.SET_PASSWORD);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Step 2: Set new password ── */
  const handleSetPassword = async (e) => {
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
      const res = await fetch(`${process.env.API_BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password.');

      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Shared input class ── */
  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
  const inputClsWithToggle = 'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-base text-slate-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden';

  /* ── Progress indicators ── */
  const stepLabels = ['Verify ID', 'New Password'];
  const activeStep = Math.min(step - 1, 1);

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

          {/* ── STEP 1: Enter National ID ── */}
          {step === STEPS.NATIONAL_ID && (
            <form onSubmit={handleCheckNationalId} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Forgot Password</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Enter your National ID to verify your identity and reset your password.
                </p>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  National ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <FaIdCard size={15} />
                  </div>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="Enter your National ID"
                    autoComplete="username"
                    className={inputCls}
                    required
                  />
                </div>
                <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">Your National ID is required to initiate password recovery.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#233e90] text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading
                  ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : 'Continue'}
              </button>
            </form>
          )}

          {/* ── STEP 2: Set new password ── */}
          {step === STEPS.SET_PASSWORD && (
            <form onSubmit={handleSetPassword} className="space-y-6">
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
                    className={`${inputClsWithToggle}`}
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
                    className={`${inputClsWithToggle}`}
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

          {/* ── STEP 3: Done ── */}
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
