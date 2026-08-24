'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaUserAlt, FaSignInAlt, FaLock,
  FaExclamationCircle,
  FaChartLine, FaClipboardCheck,
  FaEye, FaEyeSlash
} from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials or server error.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Quick-sync for legacy keys if needed
      Object.keys(data.user).forEach((key) => {
        localStorage.setItem(key, String(data.user[key]));
      });

      window.location.href = '/home';
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full bg-slate-50 dark:bg-slate-950 font-sans selection:bg-sky-100 dark:selection:bg-sky-900/40">
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
      {/* LEFT PANEL — Centered Branding             */}
      {/* ────────────────────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-blue-700 lg:flex">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-sky-500/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/40 blur-[100px]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Content Container - Centered horizontally and vertically */}
        <div className="relative z-10 w-full max-w-xl px-12 animate-content">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <img
                src="/images/logo.png"
                alt="Awash Insurance"
                className="h-9 w-auto"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">አዋሽ ኢንሹራንስ</h1>
              <p className="text-xs font-medium text-sky-200 uppercase tracking-[0.2em]">Awash Insurance S.C.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-extrabold leading-[1.1] text-white">
              Securely Manage Your <span className="text-sky-300 underline decoration-sky-400/30 underline-offset-8">Shareholder</span> Portfolio.
            </h2>
            <p className="text-lg text-blue-100/70 leading-relaxed max-w-md">
              Access real-time dividend tracking, reinvestment options, and secure data handling designed for our valued shareholders.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              { icon: FaChartLine, title: 'Portfolio Insights', desc: 'Track your growth and dividend history.' },
              { icon: FaClipboardCheck, title: 'Easy Compliance', desc: 'Manage tax documents and legal forms.' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 p-5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all cursor-default">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400 text-blue-900">
                  <item.icon />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-blue-100/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright - Pinned to bottom so it doesn't interfere with centering */}
        <div className="absolute bottom-10 text-center w-full">
          <p className="text-sm text-blue-200/40">
            &copy; {new Date().getFullYear()} Awash Insurance Shareholder Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* RIGHT PANEL — Centered Login Form          */}
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

        {/* ── Form area — fills all remaining height and centers content ── */}
        <div className="flex flex-1 items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:p-12">
          <div className="relative z-10 w-full max-w-[420px] animate-content">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:bg-transparent">
              <div className="mb-7 text-left sm:mb-10 lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Welcome Back</h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">Please enter your details to access your account.</p>
              </div>

              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-600 dark:text-red-300">
                  <FaExclamationCircle className="shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Login Identity</label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-600">
                      <FaUserAlt size={16} />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="ID, Phone, or Full Name"
                      autoComplete="username"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="ml-1 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
                    <button type="button" onClick={() => router.push('/forgot-password')} className="text-xs font-bold text-blue-600 transition-colors hover:text-blue-700">Forgot password?</button>
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-600">
                      <FaLock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ WebkitTextSecurity: showPassword ? 'none' : undefined }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-base text-slate-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 sm:py-4"
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
