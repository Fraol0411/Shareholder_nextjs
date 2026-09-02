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
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { FaExclamationCircle } from 'react-icons/fa';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../components/LanguageProvider';

const USER_TYPES = {
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
};

const STEPS = { VERIFY: 1, SET_PASSWORD: 2, DONE: 3 };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(STEPS.VERIFY);

  const [userType, setUserType] = useState(USER_TYPES.INDIVIDUAL);
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isIndividual = userType === USER_TYPES.INDIVIDUAL;

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setIdentifier('');
    setError('');
  };

  const handleVerifyIdentity = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      return setError(isIndividual ? t('auth.nationalIdRequired') : t('auth.tinRequired'));
    }
    if (!/^\d+$/.test(trimmedId)) {
      return setError(t('auth.digitsOnly'));
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedId, userType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            (isIndividual ? t('forgot.noAccountNationalId') : t('forgot.noAccountTin'))
        );
      }

      setStep(STEPS.SET_PASSWORD);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError(t('password.minLength'));
    }
    if (newPassword !== confirmPassword) {
      return setError(t('password.mismatch'));
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          userType,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('password.updateFailed'));

      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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

  const stepLabels = [t('forgot.verifyIdentity'), t('forgot.newPasswordStep')];
  const activeStep = Math.min(step - 1, 1);

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-slate-50 font-sans dark:bg-[#0b1120]">
      <div className="flex shrink-0 items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#111827] dark:hover:text-white"
        >
          <HiOutlineArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          {t('forgot.backToLogin')}
        </button>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle variant="login" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-8">
        <div className="w-full max-w-[460px]">
          {step < STEPS.DONE && (
            <div className="mb-8 flex items-center gap-0">
              {stepLabels.map((label, index) => (
                <div key={label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        index < activeStep
                          ? 'bg-brand-primary text-white dark:bg-[#2563eb]'
                          : index === activeStep
                            ? 'bg-brand-primary text-white ring-4 ring-brand-primary/15 dark:bg-[#2563eb] dark:ring-[#2563eb]/20'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {index < activeStep ? '✓' : index + 1}
                    </div>
                    <span
                      className={`mt-1 text-[10px] font-medium ${
                        index <= activeStep
                          ? 'text-brand-primary dark:text-brand-secondary'
                          : 'text-slate-400'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`mx-1 mb-4 h-0.5 flex-1 transition-colors ${
                        index < activeStep ? 'bg-brand-primary dark:bg-[#2563eb]' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
              <FaExclamationCircle className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {step === STEPS.VERIFY && (
            <form onSubmit={handleVerifyIdentity} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {t('forgot.title')}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t('forgot.subtitle')}
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-700 dark:text-white">{t('forgot.iAmA')}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUserTypeChange(USER_TYPES.INDIVIDUAL)}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                    isIndividual ? selectorActiveCls : selectorInactiveCls
                  }`}
                >
                  {renderSelectorIcon(HiOutlineUser, isIndividual)}
                  <p
                    className={`text-sm font-bold ${isIndividual ? 'text-brand-primary dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {t('auth.individual')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.shareholder')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUserTypeChange(USER_TYPES.CORPORATE)}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                    !isIndividual ? selectorActiveCls : selectorInactiveCls
                  }`}
                >
                  {renderSelectorIcon(HiOutlineBuildingOffice2, !isIndividual)}
                  <p
                    className={`text-sm font-bold ${!isIndividual ? 'text-brand-primary dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {t('auth.corporate')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.shareholder')}</p>
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-brand-primary dark:text-brand-secondary">
                {isIndividual ? (
                  <HiOutlineUser className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <HiOutlineBuildingOffice2 className="h-4 w-4" strokeWidth={1.75} />
                )}
                {isIndividual ? t('forgot.individualVerification') : t('forgot.corporateVerification')}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">
                  {isIndividual ? t('auth.nationalId') : t('auth.tin')}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                    {isIndividual ? (
                      <HiOutlineUser className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    ) : (
                      <HiOutlineBuildingOffice2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value.replace(/\D/g, ''))}
                    placeholder={isIndividual ? t('auth.enterNationalId') : t('auth.enterTin')}
                    autoComplete="username"
                    className={inputCls}
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-300 dark:text-slate-600">
                    <HiOutlineIdentification className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                  {isIndividual ? t('auth.nationalIdHint') : t('auth.tinHint')}
                </p>
              </div>

              <button type="submit" disabled={isLoading} className={submitBtnCls}>
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  t('auth.continue')
                )}
              </button>
            </form>
          )}

          {step === STEPS.SET_PASSWORD && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {t('forgot.newPasswordTitle')}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t('forgot.newPasswordSubtitle')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700 dark:text-white">{t('password.new')}</label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-brand-secondary dark:text-slate-500">
                    <HiOutlineLockClosed className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder={t('password.newPlaceholder')}
                    autoComplete="new-password"
                    style={{ WebkitTextSecurity: showNew ? 'none' : undefined }}
                    className={inputClsWithToggle}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    aria-label={showNew ? t('password.hidePassword') : t('password.showPassword')}
                  >
                    {showNew ? (
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
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t('auth.reEnterPassword')}
                    autoComplete="new-password"
                    style={{ WebkitTextSecurity: showConfirm ? 'none' : undefined }}
                    className={inputClsWithToggle}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    aria-label={showConfirm ? t('password.hidePassword') : t('password.showPassword')}
                  >
                    {showConfirm ? (
                      <HiOutlineEyeSlash className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    ) : (
                      <HiOutlineEye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={submitBtnCls}>
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  t('forgot.resetPassword')
                )}
              </button>
            </form>
          )}

          {step === STEPS.DONE && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <HiOutlineCheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('forgot.passwordUpdated')}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t('forgot.passwordUpdatedDesc')}
                </p>
              </div>
              <button type="button" onClick={() => router.push('/login')} className={submitBtnCls}>
                {t('forgot.backToLogin')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
