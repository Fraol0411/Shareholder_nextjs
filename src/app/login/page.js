'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineKey,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { FaExclamationCircle } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../components/LanguageProvider';

const LOGIN_TYPES = {
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [enrollType, setEnrollType] = useState(LOGIN_TYPES.INDIVIDUAL);
  const [enrollIdentifier, setEnrollIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordSetSuccess, setPasswordSetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEnrollTypeChange = (type) => {
    setEnrollType(type);
    setEnrollIdentifier('');
    setError('');
  };

  const inferEnrollType = () => LOGIN_TYPES.INDIVIDUAL;

  const openEnrollForm = (type = LOGIN_TYPES.INDIVIDUAL) => {
    setEnrollType(type);
    setEnrollIdentifier('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordSetSuccess(false);
    setShowChangePassword(true);
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      return setError(t('auth.loginIdRequired'));
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('auth.invalidCredentials'));
      }

      if (data.needsPasswordChange) {
        openEnrollForm(inferEnrollType());
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      Object.keys(data.user).forEach((key) => {
        localStorage.setItem(key, String(data.user[key]));
      });

      window.location.href = '/home';
    } catch (err) {
      setError(err.message || t('auth.unexpectedError'));
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedId = enrollIdentifier.trim();
    const isEnrollIndividual = enrollType === LOGIN_TYPES.INDIVIDUAL;

    if (!trimmedId) {
      return setError(isEnrollIndividual ? t('auth.nationalIdRequired') : t('auth.tinRequired'));
    }
    if (!/^\d+$/.test(trimmedId)) {
      return setError(t('auth.digitsOnly'));
    }
    if (newPassword.length < 6) {
      return setError(t('password.minLength'));
    }
    if (newPassword !== confirmPassword) {
      return setError(t('password.mismatch'));
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: trimmedId,
          userType: enrollType,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('auth.setPasswordFailed'));
      }

      setShowChangePassword(false);
      setPasswordSetSuccess(true);
      setIdentifier('');
      setPassword('');
      setEnrollIdentifier('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || t('auth.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToSignIn = () => {
    setShowChangePassword(false);
    setError('');
    setEnrollIdentifier('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600/50 dark:bg-[#111827] dark:text-white dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-brand-secondary dark:focus:ring-brand-secondary/15';
  const inputClsWithToggle =
    'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600/50 dark:bg-[#111827] dark:text-white dark:shadow-none dark:placeholder:text-slate-500 dark:focus:border-brand-secondary dark:focus:ring-brand-secondary/15 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden';

  const selectorActiveCls =
    'border-brand-secondary bg-brand-secondary-soft shadow-sm dark:border-brand-secondary dark:bg-[#0f1f35] dark:shadow-[inset_0_0_24px_rgba(69,199,232,0.06)]';
  const selectorInactiveCls =
    'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700/60 dark:bg-[#111827]/90 dark:hover:border-slate-600';
  const submitBtnCls =
    'relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-70 dark:bg-[#2563eb] dark:shadow-[#2563eb]/25 dark:hover:bg-[#1d4ed8] sm:py-4';

  const isEnrollIndividual = enrollType === LOGIN_TYPES.INDIVIDUAL;

  const renderSelectorIcon = (Icon, active) => (
    <div
      className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${
        active ? 'bg-brand-secondary/15 dark:bg-brand-secondary/20' : ''
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active ? 'text-brand-secondary' : 'text-slate-400 dark:text-slate-500'}`}
        strokeWidth={1.75}
      />
    </div>
  );

  return (
    <div className="relative flex min-h-dvh w-full bg-slate-50 font-sans dark:bg-[#0b1120]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-content { animation: fadeIn 0.8s ease-out forwards; }
        .bg-mesh {
          background-color: #f8fafc;
          background-image: radial-gradient(at 0% 0%, rgba(4, 162, 204, 0.12) 0, transparent 50%),
                            radial-gradient(at 100% 100%, rgba(35, 62, 144, 0.08) 0, transparent 50%);
        }
        .dark .bg-mesh {
          background-color: #0b1120;
          background-image: none;
        }
      `}</style>

      {/* LEFT PANEL */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-brand-primary lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] h-[70%] w-[70%] rounded-full bg-brand-secondary/25 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-black/25 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
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
              {t('auth.heroTitleStart')}{' '}
              <span className="text-brand-secondary underline decoration-brand-secondary/30 underline-offset-8">
                {t('auth.heroHighlight')}
              </span>{' '}
              {t('auth.heroTitleEnd')}
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-white/70">
              {t('auth.heroDescription')}
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex cursor-default items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:bg-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary text-brand-primary">
                <HiOutlineChartBar className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('auth.portfolioInsights')}</h3>
                <p className="text-sm text-white/55">{t('auth.portfolioInsightsDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 w-full space-y-3 text-center">
          <p className="inline-flex items-center justify-center gap-2 text-sm text-white/55">
            <HiOutlineShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            {t('auth.securityNote')}
          </p>
          <p className="text-sm text-white/45">
            {t('auth.copyright').replace('{year}', String(currentYear))}
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-mesh relative flex w-full min-h-dvh flex-col lg:w-1/2">
        <div className="flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 lg:absolute lg:right-5 lg:top-5 lg:z-30 lg:justify-end lg:p-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-slate-700">
              <img src="/images/logo.png" alt="Awash Insurance" className="h-7 w-auto" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">አዋሽ ኢንሹራንስ</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('auth.portalSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle variant="login" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:p-12">
          <div className="relative z-10 w-full max-w-[460px] animate-content">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/50 dark:bg-[#111827]/60 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none dark:lg:border-0 dark:lg:bg-transparent">

              {showChangePassword && (
                <button
                  type="button"
                  onClick={goBackToSignIn}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-primary dark:text-slate-400 dark:hover:text-brand-secondary"
                >
                  <HiOutlineArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                  {t('auth.backToSignIn')}
                </button>
              )}

              {!showChangePassword ? (
                <>
                  <div className="mb-7 text-left sm:mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t('auth.welcomeBack')}</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">
                      {t('auth.signInSubtitle')}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                      <FaExclamationCircle className="shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}

                  {passwordSetSuccess && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <HiOutlineCheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                      <p className="font-medium">{t('auth.passwordSetSuccess')}</p>
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">{t('auth.loginId')}</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                          <HiOutlineIdentification className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          placeholder={t('auth.loginIdPlaceholder')}
                          autoComplete="username"
                          className={inputCls}
                          required
                        />
                      </div>
                      <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                        {t('auth.loginIdHint')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="ml-1 flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700 dark:text-white">{t('auth.password')}</label>
                        <button
                          type="button"
                          onClick={() => router.push('/forgot-password')}
                          className="text-xs font-bold text-brand-primary transition-colors hover:text-brand-primary-hover dark:text-brand-secondary"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                          <HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder={t('auth.passwordPlaceholder')}
                          autoComplete="current-password"
                          style={{ WebkitTextSecurity: showPassword ? 'none' : undefined }}
                          className={inputClsWithToggle}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                          aria-label={showPassword ? t('password.hidePassword') : t('password.showPassword')}
                        >
                          {showPassword ? (
                            <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          ) : (
                            <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={submitBtnCls}
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <span>{t('auth.login')}</span>
                          {/* <HiOutlineArrowRightOnRectangle className="h-5 w-5 opacity-80" strokeWidth={1.75} /> */}
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('auth.notEnrolled')}{' '}
                      <button
                        type="button"
                        onClick={() => openEnrollForm()}
                        className="font-bold text-brand-primary transition-colors hover:text-brand-primary-hover dark:text-brand-secondary"
                      >
                        {t('auth.enrollNow')}
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-7 text-left sm:mb-8">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10 dark:bg-brand-secondary/20">
                      <HiOutlineKey className="h-6 w-6 text-brand-secondary dark:text-brand-secondary" strokeWidth={1.75} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t('auth.createAccount')}</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 sm:mt-2">
                      {t('auth.createAccountSubtitle')}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                      <FaExclamationCircle className="shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}

                  <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-white">{t('auth.enrollingAs')}</p>
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleEnrollTypeChange(LOGIN_TYPES.INDIVIDUAL)}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                        isEnrollIndividual ? selectorActiveCls : selectorInactiveCls
                      }`}
                    >
                      {renderSelectorIcon(HiOutlineUser, isEnrollIndividual)}
                      <p className={`text-sm font-bold ${isEnrollIndividual ? 'text-brand-primary dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {t('auth.individual')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.shareholder')}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEnrollTypeChange(LOGIN_TYPES.CORPORATE)}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                        !isEnrollIndividual ? selectorActiveCls : selectorInactiveCls
                      }`}
                    >
                      {renderSelectorIcon(HiOutlineBuildingOffice2, !isEnrollIndividual)}
                      <p className={`text-sm font-bold ${!isEnrollIndividual ? 'text-brand-primary dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {t('auth.corporate')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.shareholder')}</p>
                    </button>
                  </div>

                  <form onSubmit={handleSetPassword} className="space-y-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-primary dark:text-brand-secondary">
                      {isEnrollIndividual ? (
                        <HiOutlineUser className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <HiOutlineBuildingOffice2 className="h-4 w-4" strokeWidth={1.75} />
                      )}
                      {isEnrollIndividual ? t('auth.individualEnrollment') : t('auth.corporateEnrollment')}
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">
                        {isEnrollIndividual ? t('auth.nationalId') : t('auth.tin')}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                          {isEnrollIndividual ? (
                            <HiOutlineUser className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          ) : (
                            <HiOutlineBuildingOffice2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={enrollIdentifier}
                          onChange={(event) => setEnrollIdentifier(event.target.value.replace(/\D/g, ''))}
                          placeholder={isEnrollIndividual ? t('auth.enterNationalId') : t('auth.enterTin')}
                          className={inputCls}
                          required
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-300 dark:text-slate-600">
                          <HiOutlineIdentification className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </div>
                      </div>
                      <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                        {isEnrollIndividual ? t('auth.nationalIdHint') : t('auth.tinHint')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">Password</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                          <HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </div>
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder={t('password.newPlaceholder')}
                          autoComplete="new-password"
                          style={{ WebkitTextSecurity: showNewPwd ? 'none' : undefined }}
                          className={inputClsWithToggle}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd((value) => !value)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                          aria-label={showNewPwd ? t('password.hidePassword') : t('password.showPassword')}
                        >
                          {showNewPwd ? (
                            <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          ) : (
                            <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">{t('auth.confirmPassword')}</label>
                      <div className="group relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                          <HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </div>
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder={t('auth.reEnterPassword')}
                          autoComplete="new-password"
                          style={{ WebkitTextSecurity: showConfirmPwd ? 'none' : undefined }}
                          className={inputClsWithToggle}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd((value) => !value)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                          aria-label={showConfirmPwd ? t('password.hidePassword') : t('password.showPassword')}
                        >
                          {showConfirmPwd ? (
                            <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          ) : (
                            <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={submitBtnCls}
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <>
                          <span>{t('auth.continue')}</span>
                          <HiOutlineCheckCircle className="h-5 w-5 opacity-80" strokeWidth={1.75} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 lg:hidden">
              {t('auth.copyrightShort').replace('{year}', String(currentYear))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
