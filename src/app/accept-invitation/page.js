/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineIdentification, HiOutlineKey,
  HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineCheckCircle,
  HiOutlineExclamationTriangle, HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import { FaAngleRight, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../components/LanguageProvider';
import { ArrowRight, ArrowRightFromLine } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  // 'loading' | 'no-token' | 'closed' | 'verify' | 'password' | 'done' | 'activated' | 'used'
  const [step, setStep] = useState('loading');
  const [token, setToken] = useState('');
  const [campaign, setCampaign] = useState(null);

  const [nationalId, setNationalId] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [setupToken, setSetupToken] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [setupExpiresAt, setSetupExpiresAt] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectIn, setRedirectIn] = useState(0);
  const [redirectTotal, setRedirectTotal] = useState(5);

  // Read the unique activation token from the URL (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t0 = (params.get('token') || '').trim();
    if (!t0) {
      setStep('no-token');
      return;
    }
    setToken(t0);

    // Check the campaign window, and this link's own state, before showing the form
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/activation/status?token=${encodeURIComponent(t0)}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaign(data);

        // Reopening a link that already did its job: say so, then go sign in.
        if (data.link?.state === 'activated') {
          setRedirectTotal(10);
          setRedirectIn(10);
          setStep('activated');
          return;
        }
        // Verified but never completed — the link is single-use, so it is spent.
        if (data.link?.state === 'verified') {
          setStep('used');
          return;
        }

        if (!data.exists) setStep('closed');
        else if (data.beforeStart) setStep('closed');
        else if (data.ended) setStep('closed');
        else setStep('verify');
      })
      .catch(() => setStep('verify')); // if status check fails, still allow the API-guarded flow
  }, []);

  // Countdown for the short-lived setup session
  useEffect(() => {
    if (!setupExpiresAt) return;
    const timer = setInterval(() => {
      if (Date.now() >= setupExpiresAt) {
        setError('Your setup session expired. Please restart activation with a new code.');
        setStep('closed');
        setSetupToken('');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [setupExpiresAt]);

  // After activation (or when a completed link is reopened): count down to sign-in
  useEffect(() => {
    if (step !== 'done' && step !== 'activated') return;
    if (redirectIn <= 0) {
      router.replace(step === 'done' ? '/login?activated=1' : '/login');
      return;
    }
    const timer = setTimeout(() => setRedirectIn((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, redirectIn, router]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d+$/.test(nationalId.trim())) return setError('Enter your National ID (FAN/FCN) / TIN (digits only).');
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit verification code from your SMS.');

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/activation/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nationalId: nationalId.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Activated in another tab/earlier session — same friendly ending as on open
        if (data.alreadyActivated) {
          setRedirectTotal(data.redirectSeconds || 10);
          setRedirectIn(data.redirectSeconds || 10);
          setStep('activated');
          return;
        }
        throw Object.assign(new Error(data.message || 'Verification failed'), { data });
      }

      setSetupToken(data.setupToken);
      setSetupExpiresAt(Date.now() + (data.expiresInSeconds || 600) * 1000);
      setAttemptsRemaining(null);
      setStep('password');
    } catch (err) {
      setError(err.message);
      if (err.data?.attemptsRemaining != null) setAttemptsRemaining(err.data.attemptsRemaining);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters long.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/activation/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to set password.');

      setStep('done');
      setRedirectTotal(5);
      setRedirectIn(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600/50 dark:bg-[#111827] dark:text-white dark:shadow-none dark:placeholder:text-slate-500';
  const inputClsWithToggle = `${inputCls} pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`;
  const submitBtnCls = 'relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-70 dark:bg-[#2563eb] dark:shadow-[#2563eb]/25 dark:hover:bg-[#1d4ed8]';

  const renderBody = () => {
    if (step === 'loading') {
      return <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary/20 border-t-brand-primary" /></div>;
    }

    if (step === 'no-token') {
      return (
        <div className="py-4 text-center">
          <HiOutlineExclamationTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Activation link required</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Account activation is done only through the personalized link sent to your phone by Awash Insurance. Please use that link, or contact your branch.
          </p>
          <button type="button" onClick={() => router.push('/')} className={`${submitBtnCls} mt-6`}>Go to Sign In</button>
        </div>
      );
    }

    if (step === 'closed') {
      const opensAt = campaign?.startsAt ? new Date(campaign.startsAt).toLocaleString() : null;
      const closedMessage = campaign?.beforeStart && opensAt
        ? `Account activation opens on ${opensAt}.`
        : campaign?.disabled
          ? 'Account activation is temporarily closed by Awash Insurance. Your link stays safe — please check back later or contact your branch.'
          : 'This activation link is no longer valid or the activation period has ended. Please contact your branch for a new invitation.';
      return (
        <div className="py-4 text-center">
          <HiOutlineLockClosed className="mx-auto mb-3 h-10 w-10 text-slate-400" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Activation window is not open</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {error || closedMessage}
          </p>
          <button type="button" onClick={() => router.push('/')} className={`${submitBtnCls} mt-6`}>Go to Sign In</button>
        </div>
      );
    }

    if (step === 'activated') {
      return (
        <div className="py-4 text-center">
          <HiOutlineCheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">This link has already been used</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your shareholder account is already activated, so there is nothing left to set up with this link.
            Sign in with your password — taking you to sign in in {redirectIn}s…
          </p>
          <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(redirectIn / redirectTotal) * 100}%` }} />
          </div>
          <button type="button" onClick={() => router.replace('/login')} className={`${submitBtnCls} mt-6`}>Go to Sign In Now</button>
        </div>
      );
    }

    if (step === 'used') {
      return (
        <div className="py-4 text-center">
          <HiOutlineExclamationTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">This link was never completed</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The identity check on this link was done, but no password was ever set. For your security a link
            works only once, so this one is spent — please contact your Awash Insurance branch or the shareholder
            desk and ask them to send you a new activation link.
          </p>
          <button type="button" onClick={() => router.push('/')} className={`${submitBtnCls} mt-6`}>Go to Sign In</button>
        </div>
      );
    }

    if (step === 'verify') {
      return (
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">National ID (FAN/FCN) / Business TIN <span className="text-red-500">*</span></label>
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"><HiOutlineIdentification className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
              <input type="text" inputMode="numeric" value={nationalId} onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))} placeholder="Enter your ID number" autoComplete="off" className={inputCls} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">Verification Code <span className="text-red-500">*</span></label>
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"><HiOutlineShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
              <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="Enter Verification code" autoComplete="one-time-code" className={`${inputCls} tracking-widest`} required />
            </div>
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <p className="ml-1 text-xs font-medium text-amber-600 dark:text-amber-400">{attemptsRemaining} attempt(s) remaining before a temporary lock.</p>
            )}
          </div>
          <button type="submit" disabled={isLoading} className={submitBtnCls}>
            {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Verify Identity</span><FaAngleRight className="h-5 w-5 opacity-80" strokeWidth={1.75} /></>}
          </button>
        </form>
      );
    }

    if (step === 'password') {
      return (
        <form onSubmit={handleSetPassword} className="space-y-5">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">New Password</label>
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"><HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
              <input type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Create a password (min 8 characters)" autoComplete="new-password" className={inputClsWithToggle} minLength={8} required />
              <button type="button" onClick={() => setShowNewPwd((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showNewPwd ? <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">Confirm Password</label>
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"><HiOutlineKey className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
              <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" className={inputClsWithToggle} minLength={8} required />
              <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showConfirmPwd ? <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className={submitBtnCls}>
            {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span>Activate My Account</span>}
          </button>
        </form>
      );
    }

    // step === 'done'
    return (
      <div className="py-4 text-center">
        <HiOutlineCheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Account activated!</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your password has been set successfully. Taking you to sign in in {redirectIn}s…
        </p>
        <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(redirectIn / redirectTotal) * 100}%` }} />
        </div>
        <button type="button" onClick={() => router.replace('/login?activated=1')} className={`${submitBtnCls} mt-6`}>Go to Sign In Now</button>
      </div>
    );
  };

  const titles = {
    verify: ['Verify Your Identity', 'Enter your National ID (FAN/FCN) or Business TIN for corporate) and the 6-digit code we sent to your phone.'],
    password: ['Create Your Password', 'Identity verified. Choose a password to complete your account activation.'],
  };
  const title = titles[step]?.[0] || t('invitation.title') || 'Accept account invitation';
  const subtitle = titles[step]?.[1] || '';

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-slate-50 px-4 py-12 font-sans dark:bg-[#0b1120]">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-content { animation: fadeIn 0.7s ease-out forwards; }
      `}</style>

      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSelector />
        <ThemeToggle variant="login" />
      </div>

      <div className="w-full max-w-[520px] animate-content">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-slate-700">
            <img src="/images/logo.png" alt="Awash Insurance" className="h-9 w-auto" />
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">{t('auth.companyName') || 'Awash Insurance'}</span>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-[#111827] dark:shadow-black/30 sm:p-10">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-700 dark:text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>

          {error && step !== 'closed' && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              <FaExclamationCircle className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {renderBody()}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {(t('auth.copyright') || '© {year} Awash Insurance S.C.').replace('{year}', String(currentYear))}
        </p>
      </div>
    </div>
  );
}
