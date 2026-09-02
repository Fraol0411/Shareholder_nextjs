'use client';

import { useEffect, useState } from 'react';
import {
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { FaExclamationCircle } from 'react-icons/fa';
import { useTranslation } from './LanguageProvider';
import { getToken } from '../libs/auth';

export default function ChangePasswordModal({ open, onClose }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, isLoading, onClose]);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError('');
    setSuccess(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    if (isLoading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
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
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('password.updateFailed'));
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch (err) {
      setError(err.message || t('password.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600/50 dark:bg-[#111827] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-secondary dark:focus:ring-brand-secondary/15';
  const inputClsWithToggle = `${inputCls} [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-secondary/15 text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary">
              <HiOutlineKey className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 id="change-password-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {t('password.changeTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('password.changeSubtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <HiOutlineXMark className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <HiOutlineCheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('password.updated')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                  <FaExclamationCircle className="shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('password.current')}
                </label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-brand-secondary dark:text-slate-500">
                    <HiOutlineLockClosed className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder={t('password.currentPlaceholder')}
                    autoComplete="current-password"
                    className={inputClsWithToggle}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showCurrent ? t('password.hidePassword') : t('password.showPassword')}
                  >
                    {showCurrent ? (
                      <HiOutlineEyeSlash className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <HiOutlineEye className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('password.new')}</label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-brand-secondary dark:text-slate-500">
                    <HiOutlineLockClosed className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder={t('password.newPlaceholder')}
                    autoComplete="new-password"
                    minLength={6}
                    className={inputClsWithToggle}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showNew ? t('password.hidePassword') : t('password.showPassword')}
                  >
                    {showNew ? (
                      <HiOutlineEyeSlash className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <HiOutlineEye className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('password.confirm')}
                </label>
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 group-focus-within:text-brand-secondary dark:text-slate-500">
                    <HiOutlineLockClosed className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t('password.confirmPlaceholder')}
                    autoComplete="new-password"
                    minLength={6}
                    className={inputClsWithToggle}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showConfirm ? t('password.hidePassword') : t('password.showPassword')}
                  >
                    {showConfirm ? (
                      <HiOutlineEyeSlash className="h-4 w-4" strokeWidth={1.75} />
                    ) : (
                      <HiOutlineEye className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t('password.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary-hover disabled:opacity-70 dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8]"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    t('password.update')
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
