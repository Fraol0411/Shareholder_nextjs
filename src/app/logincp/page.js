'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck, HiOutlineChartBar, HiOutlineKey, HiOutlineArrowLeft,
  HiOutlineCheckCircle, HiOutlineIdentification, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { FaExclamationCircle } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../components/LanguageProvider';

export default function LoginCpPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [enrollStep, setEnrollStep] = useState('details');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Rate Limiting & Lock States
  const [cooldown, setCooldown] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [remainingIn24h, setRemainingIn24h] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // Countdown Timers
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setTimeout(() => setLockSeconds(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [lockSeconds]);

  // Sync status from DB (survives page refresh)
  const fetchOtpStatus = async (phoneNumber) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/set-passwordcp?phone=${encodeURIComponent(phoneNumber)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCooldown(data.cooldown || 0);
      setRemainingIn24h(data.remainingIn24h ?? null);
      setLockSeconds(data.lockSeconds || 0);
      setAttemptsRemaining(data.hasPendingOtp ? Math.max(0, (data.maxFailedAttempts || 5) - (data.failedAttempts || 0)) : null);
    } catch {}
  };

  useEffect(() => {
    if (showChangePassword && enrollStep === 'verify' && phone) {
      fetchOtpStatus(phone.trim());
    }
  }, [enrollStep, showChangePassword, phone]);

  const formatLockTime = (total) => {
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const openEnrollForm = () => {
    setEnrollStep('details');
    setPhone(''); setOtp(''); setNewPassword(''); setConfirmPassword('');
    setError(''); setPasswordSetSuccess(false); setShowChangePassword(true);
    setCooldown(0); setLockSeconds(0); setRemainingIn24h(null); setAttemptsRemaining(null);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError('');
    if (!identifier.trim()) return setError(t('auth.loginIdRequired') || 'Login ID is required');

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials');

      if (data.needsPasswordChange) { openEnrollForm(); setIsLoading(false); return; }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      Object.keys(data.user).forEach((key) => localStorage.setItem(key, String(data.user[key])));
      window.location.href = '/shareholder/home';
    } catch (err) {
      setError(err.message || 'Unexpected error');
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setError('');

    if (cooldown > 0) return setError(`Please wait ${cooldown} seconds before requesting a new code.`);
    if (remainingIn24h === 0) return setError('Daily OTP limit reached. Try again tomorrow.');

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return setError('Phone number is required');
    if (!/^\+?\d+$/.test(trimmedPhone)) return setError('Phone number must contain digits only');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/set-passwordcp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) { setCooldown(data.retryAfter || 60); setError(data.message); return; }
        if (res.status === 403) { setError(data.message || 'Password already set.'); setTimeout(goBackToSignIn, 2500); return; }
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      setCooldown(data.cooldown ?? 60);
      setRemainingIn24h(data.remainingIn24h ?? null);
      setLockSeconds(0); // New code clears lock
      setAttemptsRemaining(null);
      setEnrollStep('verify');
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{4,6}$/.test(otp.trim())) return setError('Enter the verification code sent to your phone');

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim(), newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423 || data.code === 'OTP_LOCKED') {
          setLockSeconds(data.retryAfter || 15 * 60);
          setAttemptsRemaining(null);
          setError(data.message);
          return;
        }
        if (data.code === 'OTP_INVALID') {
          setAttemptsRemaining(data.attemptsRemaining ?? null);
          setError(data.message);
          return;
        }
        throw new Error(data.message || 'Verification failed');
      }

      setPasswordSetSuccess(true);
      setShowChangePassword(false);
      setPhone(''); setOtp(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToSignIn = () => {
    setShowChangePassword(false); setEnrollStep('details'); setError('');
    setPhone(''); setOtp(''); setNewPassword(''); setConfirmPassword('');
    setCooldown(0); setLockSeconds(0); setRemainingIn24h(null); setAttemptsRemaining(null);
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600/50 dark:bg-[#111827] dark:text-white dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-brand-secondary dark:focus:ring-brand-secondary/15';
  const inputClsWithToggle = `${inputCls} [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`;
  const submitBtnCls = 'relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-70 dark:bg-[#2563eb] dark:shadow-[#2563eb]/25 dark:hover:bg-[#1d4ed8] sm:py-4';

  return (
    <div className="relative flex min-h-dvh w-full bg-slate-50 font-sans dark:bg-[#0b1120]">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-content { animation: fadeIn 0.8s ease-out forwards; }
        .bg-mesh { background-color: #f8fafc; background-image: radial-gradient(at 0% 0%, rgba(4, 162, 204, 0.12) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(35, 62, 144, 0.08) 0, transparent 50%); }
        .dark .bg-mesh { background-color: #0b1120; background-image: none; }
      `}</style>

      {/* LEFT PANEL */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-brand-primary lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] h-[70%] w-[70%] rounded-full bg-brand-secondary/25 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-black/25 blur-[100px]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 w-full max-w-xl px-12 animate-content">
          <div className="mb-12 flex items-center gap-3 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white shadow-2xl">
              <img src="/images/logo.png" alt="Awash Insurance" className="h-9 w-auto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">አዋሽ ኢንሹራንስ</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-secondary">Awash Insurance S.C.</p>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-5xl font-extrabold leading-[1.1] text-white">
              {t('auth.heroTitleStart') || 'Securely Manage Your'} <span className="text-brand-secondary underline decoration-brand-secondary/30 underline-offset-8">{t('auth.heroHighlight') || 'Shareholder'}</span> {t('auth.heroTitleEnd') || 'Portfolio.'}
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-white/70">{t('auth.heroDescription') || 'Experience the next generation of dividend management.'}</p>
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex cursor-default items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary text-brand-primary"><HiOutlineChartBar className="h-5 w-5" strokeWidth={1.75} /></div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.portfolioInsights') || 'Portfolio Insights'}</h3>
                <p className="text-sm text-white/55">{t('auth.portfolioInsightsDesc') || 'Track your growth and dividend history.'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 w-full space-y-3 text-center">
          <p className="inline-flex items-center justify-center gap-2 text-sm text-white/55"><HiOutlineShieldCheck className="h-4 w-4" strokeWidth={1.75} /> {t('auth.securityNote') || 'End-to-end encrypted & secure'}</p>
          <p className="text-sm text-white/45">{(t('auth.copyright') || '© {year} Awash Insurance S.C.').replace('{year}', String(currentYear))}</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-mesh relative flex w-full min-h-dvh flex-col lg:w-1/2">
        <div className="flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:absolute lg:right-5 lg:top-5 lg:z-30 lg:justify-end lg:p-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-slate-700"><img src="/images/logo.png" alt="Awash Insurance" className="h-7 w-auto" /></div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">አዋሽ ኢንሹራንስ</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('auth.portalSubtitle') || 'Shareholder Portal'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2"><LanguageSelector /><ThemeToggle variant="login" /></div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:p-12">
          <div className="relative z-10 w-full max-w-[460px] animate-content">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/50 dark:bg-[#111827]/60 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:border-0 dark:lg:bg-transparent">
              
              {showChangePassword && (
                <button type="button" onClick={goBackToSignIn} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-primary dark:text-slate-400 dark:hover:text-brand-secondary">
                  <HiOutlineArrowLeft className="h-4 w-4" strokeWidth={1.75} /> {t('auth.backToSignIn') || 'Back to Sign In'}
                </button>
              )}

              {!showChangePassword ? (
                <>
                  <div className="mb-7 text-left sm:mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t('auth.welcomeBack') || 'Welcome Back'}</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">{t('auth.signInSubtitle') || 'Please enter your details to access your account.'}</p>
                  </div>

                  {error && <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"><FaExclamationCircle className="shrink-0" /><p className="font-medium">{error}</p></div>}
                  {passwordSetSuccess && <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"><HiOutlineCheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.75} /><p className="font-medium">{t('auth.passwordSetSuccess') || 'Password set successfully! You can now sign in.'}</p></div>}

                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">{t('auth.loginId') || 'Login ID'}</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500"><HiOutlineIdentification className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
                        <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={t('auth.loginIdPlaceholder') || 'Name, Phone, Reg No, or ID'} autoComplete="username" className={inputCls} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="ml-1 flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 dark:text-white">{t('auth.password') || 'Password'}</label>
                        <button type="button" onClick={() => router.push('/forgot-password')} className="text-xs font-bold text-brand-primary transition-colors hover:text-brand-primary-hover dark:text-brand-secondary">{t('auth.forgotPassword') || 'Forgot?'}</button>
                      </div>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500"><HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder') || '••••••••'} autoComplete="current-password" className={inputClsWithToggle} required />
                        <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                          {showPassword ? <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className={submitBtnCls}>
                      {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span>{t('auth.login') || 'Sign In'}</span>}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('auth.notEnrolled') || 'First time logging in?'}{' '}
                      <button type="button" onClick={openEnrollForm} className="font-bold text-brand-primary transition-colors hover:text-brand-primary-hover dark:text-brand-secondary">{t('auth.enrollNow') || 'Activate Account'}</button>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-7 text-left sm:mb-8">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10 dark:bg-brand-secondary/20"><HiOutlineKey className="h-6 w-6 text-brand-secondary" strokeWidth={1.75} /></div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{enrollStep === 'details' ? 'Activate Your Account' : 'Verify Your Phone'}</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">
                      {enrollStep === 'details' ? 'Enter your registered phone number and choose a new password.' : `We sent a verification code to ${phone}. Enter it below to complete setup.`}
                    </p>
                  </div>

                  {lockSeconds > 0 && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                      <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                      <div>
                        <p className="font-medium">Too many incorrect attempts.</p>
                        <p className="mt-0.5">Verification locked for <span className="font-mono font-bold">{formatLockTime(lockSeconds)}</span>. Request a new code below to unlock instantly.</p>
                      </div>
                    </div>
                  )}

                  {error && lockSeconds === 0 && <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"><FaExclamationCircle className="shrink-0" /><p className="font-medium">{error}</p></div>}

                  {enrollStep === 'details' ? (
                    <form onSubmit={handleRequestOtp} className="space-y-5">
                      <div className="space-y-2">
                        <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">Phone Number <span className="text-red-500">*</span></label>
                        <div className="group relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-[18px] w-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                          </div>
                          <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 0911234567" className={inputCls} required />
                        </div>
                        <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">Use the phone number registered with your shareholder account.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">New Password</label>
                        <div className="group relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500"><HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
                          <input type={showNewPwd ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" className={inputClsWithToggle} minLength={6} required />
                          <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                            {showNewPwd ? <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">Confirm Password</label>
                        <div className="group relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500"><HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
                          <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password" className={inputClsWithToggle} minLength={6} required />
                          <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                            {showConfirmPwd ? <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading} className={submitBtnCls}>
                        {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Send Verification Code</span><HiOutlineArrowRightOnRectangle className="h-5 w-5 opacity-80" strokeWidth={1.75} /></>}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="space-y-2">
                        <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">Verification Code <span className="text-red-500">*</span></label>
                        <div className="group relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500"><HiOutlineShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} /></div>
                          <input type="text" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Enter 6-digit code" disabled={lockSeconds > 0} className={`${inputCls} text-center text-2xl tracking-widest disabled:cursor-not-allowed disabled:opacity-60`} required />
                        </div>
                        {attemptsRemaining !== null && attemptsRemaining < 5 && lockSeconds === 0 && (
                          <p className="ml-1 text-xs font-medium text-amber-600 dark:text-amber-400">{attemptsRemaining} attempt(s) remaining before a temporary lock.</p>
                        )}
                        <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                          Didn&apos;t receive the code?{' '}
                          <button type="button" onClick={handleRequestOtp} disabled={isLoading || cooldown > 0 || remainingIn24h === 0} className="font-bold text-brand-primary hover:text-brand-primary-hover dark:text-brand-secondary disabled:cursor-not-allowed disabled:opacity-50">
                            {cooldown > 0 ? `Resend in ${cooldown}s` : remainingIn24h === 0 ? 'Daily limit reached' : lockSeconds > 0 ? 'Request New Code (Unlock)' : 'Resend Code'}
                          </button>
                        </p>
                        {remainingIn24h !== null && <p className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">{remainingIn24h} of 5 verification requests remaining in the next 24 hours.</p>}
                      </div>
                      <button type="submit" disabled={isLoading || lockSeconds > 0} className={submitBtnCls}>
                        {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><span>Verify & Activate Account</span><HiOutlineCheckCircle className="h-5 w-5 opacity-80" strokeWidth={1.75} /></>}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
            <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 lg:hidden">{(t('auth.copyrightShort') || '© {year} Awash Insurance').replace('{year}', String(currentYear))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}