/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineArrowRight } from 'react-icons/hi2';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../components/LanguageProvider';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleJoin = () => {
    setIsNavigating(true);
    // Forward any invitation token from the current URL to the activation flow.
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.push(`/logincp${search}`);
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-slate-50 px-4 py-12 font-sans dark:bg-[#0b1120]">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-content { animation: fadeIn 0.7s ease-out forwards; }
      `}</style>

      {/* Top-right controls (theme + language), consistent with other auth pages */}
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSelector />
        <ThemeToggle variant="login" />
      </div>

      <div className="w-full max-w-[640px] animate-content">
        {/* Brand header: logo + company wordmark */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-slate-700">
            <img src="/images/logo.png" alt="Awash Insurance" className="h-9 w-auto" />
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            {t('auth.companyName') || 'Awash Insurance'}
          </span>
        </div>

        {/* Invitation card */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-xl shadow-slate-200/50 dark:border-slate-700/50 dark:bg-[#111827] dark:shadow-black/30 sm:p-12">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700 dark:text-slate-100 sm:text-[2rem] sm:leading-tight">
            {t('invitation.title') || 'Accept account invitation'}
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-slate-500 dark:text-slate-400">
            {t('invitation.description') ||
              "You've been invited to join a new account. To complete the setup, please click the button below."}
          </p>

          <button
            type="button"
            onClick={handleJoin}
            disabled={isNavigating}
            className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#2563eb] dark:shadow-[#2563eb]/25 dark:hover:bg-[#1d4ed8]"
          >
            {isNavigating ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <span>{t('invitation.joinAccount') || 'Join account'}</span>
                <HiOutlineArrowRight className="h-5 w-5 opacity-80" strokeWidth={2} />
              </>
            )}
          </button>

          <p className="mt-6 text-sm font-medium text-slate-400 dark:text-slate-500">
            {t('invitation.poweredBy') || 'Awash Insurance S.C.'}
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
          {(t('auth.copyright') || '© {year} Awash Insurance S.C.').replace('{year}', String(currentYear))}
        </p>
      </div>
    </div>
  );
}
