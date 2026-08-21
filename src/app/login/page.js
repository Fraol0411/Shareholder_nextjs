'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FaUserAlt, FaSignInAlt, FaLock, FaInfoCircle,
  FaExclamationCircle, FaShieldAlt,
  FaChartLine, FaFileInvoiceDollar, FaClipboardCheck,
  FaEye, FaEyeSlash
} from 'react-icons/fa';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    <div className="flex min-h-screen w-full bg-slate-50 font-sans selection:bg-sky-100">
      <style>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .bg-mesh {
          background-color: #f8fafc;
          background-image: radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0, transparent 50%), 
                            radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.1) 0, transparent 50%);
        }
      `}</style>

      {/* ────────────────────────────────────────── */}
      {/* LEFT PANEL — Branding (Hidden on Mobile)   */}
      {/* ────────────────────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-blue-700 lg:flex">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-sky-500/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/40 blur-[100px]" />
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="relative z-10 p-16">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-xl">
              <FaShieldAlt className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">አዋሽ ኢንሹራንስ</h1>
              <p className="text-xs font-medium text-sky-100 uppercase tracking-widest">Awash Insurance S.C.</p>
            </div>
          </div>

          <div className="mt-24 max-w-xl">
            <h2 className="text-5xl font-extrabold leading-tight text-white">
              Securely Manage Your <span className="text-sky-300">Shareholder</span> Portfolio.
            </h2>
            <p className="mt-6 text-lg text-blue-100/80 leading-relaxed">
              Experience the next generation of dividend management. Real-time tracking, 
              instant reinvestment options, and secure data handling designed specifically 
              for our valued shareholders.
            </p>
          </div>

          <div className="mt-16 grid gap-6">
            {[
              { icon: FaChartLine, title: 'Portfolio Insights', desc: 'Track your growth and dividend history.' },
              { icon: FaClipboardCheck, title: 'Easy Compliance', desc: 'Manage tax documents and legal forms.' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all cursor-default">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400 text-blue-900">
                  <item.icon />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-blue-100/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-16 pt-0">
          <p className="text-sm text-blue-200/50">
            &copy; {new Date().getFullYear()} Awash Insurance Shareholder Portal. All rights reserved.
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* RIGHT PANEL — Login Form                   */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-mesh flex w-full items-center justify-center p-6 lg:w-1/2 sm:p-12">
        <div className="w-full max-w-[440px]">
          {/* Mobile Header */}
          <div className="mb-10 flex flex-col items-center text-center lg:hidden">
             <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-200">
                <FaShieldAlt className="text-3xl text-white" />
             </div>
             <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">አዋሽ ኢንሹራንስ</h1>
             <p className="text-slate-500">Shareholder Portal</p>
          </div>

          <div className="mb-10 hidden lg:block">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-slate-500 italic text-sm">Please enter your details to access your account.</p>
          </div>

          {error && (
            <div className="mb-6 flex animate-shake items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              <FaExclamationCircle className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Login Identity</label>
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <FaUserAlt size={16} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ID, Phone, or Full Name"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400 uppercase font-medium tracking-tighter">
                <FaInfoCircle />
                <span>Matches your registration record</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot?</button>
              </div>
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <FaLock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
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

          <div className="mt-10 border-t border-slate-200 pt-8 text-center">
            <p className="text-slate-600">
              Not yet registered?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-bold text-blue-600 underline-offset-4 hover:underline"
              >
                Create an Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}