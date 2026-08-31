'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaUserAlt, FaSignInAlt, FaLock,
  FaExclamationCircle, FaIdCard,
  FaChartLine, FaClipboardCheck,
  FaEye, FaEyeSlash, FaCheckCircle,
  FaArrowLeft, FaKey,
} from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();

  // Sign-in fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Set-password fields
  const [nationalId, setNationalId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // View toggles
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);

  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Sign In handler ── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials or server error.');
      }

      // If user still has default password → show set-password form
      if (data.needsPasswordChange) {
        // Pre-fill national_id if the identifier looks like one
        setNationalId(identifier);
        setShowChangePassword(true);
        setIsLoading(false);
        return;
      }

      // Normal login → store credentials and redirect to home
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      Object.keys(data.user).forEach((key) => {
        localStorage.setItem(key, String(data.user[key]));
      });

      window.location.href = '/home';
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  /* ── Set new password handler ── */
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!nationalId.trim()) {
      return setError('National ID is required.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId: nationalId.trim(), newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to set password.');
      }

      // Reset all state and go back to sign-in with success message
      setShowChangePassword(false);
      setPasswordSetSuccess(true);
      setIdentifier('');
      setPassword('');
      setNationalId('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Navigation helpers ── */
  const goBackToSignIn = () => {
    setShowChangePassword(false);
    setError('');
    setNationalId('');
    setNewPassword('');
    setConfirmPassword('');
  };

  /* ── Shared input classes ── */
  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
  const inputClsWithToggle =
    'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-base text-slate-900 shadow-sm outline-none transition-all focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden';

  return (
    <div className="relative flex min-h-dvh w-full bg-slate-50 dark:bg-slate-950 font-sans">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-content { animation: fadeIn 0.8s ease-out forwards; }
        .bg-mesh {
          background-color: #f8fafc;
          background-image: radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0, transparent 50%),
                            radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.1) 0, transparent 50%);
        }
        .dark .bg-mesh {
          background-color: #0f172a;
          background-image: radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.12) 0, transparent 45%),
                            radial-gradient(at 100% 100%, rgba(30, 64, 175, 0.2) 0, transparent 50%);
        }
      `}</style>

      {/* ────────────────────────────────────────── */}
      {/* LEFT PANEL — Branding (hidden on mobile)   */}
      {/* ────────────────────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-brand-primary lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-brand-secondary/25 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-black/25 blur-[100px]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-xl px-12 animate-content">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white backdrop-blur-xl border border-white/20 shadow-2xl">
              <img src="/images/logo.png" alt="Awash Insurance" className="h-9 w-auto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">አዋሽ ኢንሹራንስ</h1>
              <p className="text-xs font-medium text-brand-secondary uppercase tracking-[0.2em]">Awash Insurance S.C.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-extrabold leading-[1.1] text-white">
              Securely Manage Your <span className="text-brand-secondary underline decoration-brand-secondary/30 underline-offset-8">Shareholder</span> Portfolio.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed max-w-md">
              Access real-time dividend tracking, reinvestment options, and secure data handling designed for our valued shareholders.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { icon: FaChartLine, title: 'Portfolio Insights', desc: 'Track your growth and dividend history.' },
              // { icon: FaClipboardCheck, title: 'Easy Compliance', desc: 'Manage tax documents and legal forms.' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 p-5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all cursor-default">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary text-brand-primary">
                  <item.icon />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-white/55">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 text-center w-full">
          <p className="text-sm text-white/45">
            &copy; {new Date().getFullYear()} Awash Insurance Shareholder Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* RIGHT PANEL                                */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-mesh relative flex w-full min-h-dvh flex-col lg:w-1/2">
        {/* ── Mobile top bar ── */}
        <div className="flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:absolute lg:right-5 lg:top-5 lg:z-30 lg:justify-end lg:p-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img src="/images/logo.png" alt="Awash Insurance" className="h-7 w-auto" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">አዋሽ ኢንሹራንስ</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Shareholder Portal</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* ── Form area ── */}
        <div className="flex flex-1 items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:p-12">
          <div className="relative z-10 w-full max-w-[420px] animate-content">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:bg-transparent">

              {/* ── Back button ── */}
              {showChangePassword && (
                <button
                  type="button"
                  onClick={goBackToSignIn}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-primary dark:text-slate-400 dark:hover:text-brand-secondary"
                >
                  <FaArrowLeft className="text-xs" />
                  Back to Sign In
                </button>
              )}

              {/* ════════════════════════════════════ */}
              {/* SIGN IN (default view)               */}
              {/* ════════════════════════════════════ */}
              {!showChangePassword && (
                <>
                  <div className="mb-7 text-left sm:mb-10">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Welcome Back</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">Please enter your details to access your account.</p>
                  </div>

                  {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-300">
                      <FaExclamationCircle className="shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}

                  {passwordSetSuccess && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                      <FaCheckCircle className="shrink-0" />
                      <p className="font-medium">Password set successfully! Sign in with your new password below.</p>
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-5 sm:space-y-6">
                    {/* Identifier */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Login Identity</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary">
                          <FaUserAlt size={16} />
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Reg No, Phone, or National ID"
                          autoComplete="username"
                          className={inputCls}
                          required
                        />
                      </div>
                      <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">You can use your Registration Number, Phone, or National ID.</p>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <div className="ml-1 flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
                        <button type="button" onClick={() => router.push('/forgot-password')} className="text-xs font-bold text-brand-primary transition-colors hover:text-brand-primary-hover">Forgot password?</button>
                      </div>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary">
                          <FaLock size={16} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          style={{ WebkitTextSecurity: showPassword ? 'none' : undefined }}
                          className={inputClsWithToggle}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-70 sm:py-4"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Sign In to Dashboard</span>
                          <FaSignInAlt className="text-sm opacity-70" />
                        </div>
                      )}
                    </button>
                  </form>

                  {/* Not enrolled yet? */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Not enrolled yet?{' '}
                      <button
                        type="button"
                        onClick={() => { setShowChangePassword(true); setError(''); setPasswordSetSuccess(false); }}
                        className="font-bold text-brand-primary transition-colors hover:text-brand-primary-hover dark:text-brand-secondary dark:hover:text-brand-secondary-hover"
                      >
                        Enroll Now!
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* ════════════════════════════════════ */}
              {/* SET NEW PASSWORD                     */}
              {/* ════════════════════════════════════ */}
              {showChangePassword && (
                <>
                  <div className="mb-7 text-left sm:mb-10">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
                      <FaKey className="text-xl text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Create Your Account</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">
                      Create a new password to secure your account. Your National ID is required.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-300">
                      <FaExclamationCircle className="shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSetPassword} className="space-y-5 sm:space-y-6">
                    {/* National ID (mandatory) */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        National ID <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary">
                          <FaIdCard size={16} />
                        </div>
                        <input
                          type="text"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          placeholder="Enter your National ID"
                          className={inputCls}
                          required
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">New Password</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary">
                          <FaLock size={16} />
                        </div>
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          style={{ WebkitTextSecurity: showNewPwd ? 'none' : undefined }}
                          className={inputClsWithToggle}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                        >
                          {showNewPwd ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Confirm Password</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary">
                          <FaLock size={16} />
                        </div>
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          style={{ WebkitTextSecurity: showConfirmPwd ? 'none' : undefined }}
                          className={inputClsWithToggle}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPwd ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-70 sm:py-4"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Continue</span>
                          <FaCheckCircle className="text-sm opacity-70" />
                        </div>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-400 lg:hidden">
              &copy; {new Date().getFullYear()} Awash Insurance S.C.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
