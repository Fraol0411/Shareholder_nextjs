'use client';

import Link from 'next/link';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa';
import { useTranslation } from './LanguageProvider';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-sky-200/50 bg-gradient-to-br from-sky-50 via-blue-50/80 to-slate-50 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Awash Insurance" className="h-11 w-auto" />
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Awash Insurance</p>
                <p className="text-sm font-medium text-sky-600 dark:text-slate-400">Shareholder Dividend Portal</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Manage dividend decisions, track shareholder submissions, and access your dividend
              information — all in one secure portal built for Awash Insurance stakeholders.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <FaShieldAlt className="text-xs" />
              </div>
              <span className="text-xs font-medium text-slate-500">Secured & Encrypted Portal</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky-700">
              {t('footer.quicklinks')}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/home" className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-sky-700">
                  <span className="h-1 w-1 rounded-full bg-sky-300 transition-all group-hover:w-3 group-hover:bg-sky-500" />
                  {t('footer.portalHome')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-sky-700">
                  <span className="h-1 w-1 rounded-full bg-sky-300 transition-all group-hover:w-3 group-hover:bg-sky-500" />
                  {t('footer.checkDividend')}
                </Link>
              </li>
              <li>
                <Link href="/fillform" className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-sky-700">
                  <span className="h-1 w-1 rounded-full bg-sky-300 transition-all group-hover:w-3 group-hover:bg-sky-500" />
                  {t('footer.fillForm')}
                </Link>
              </li>
              <li>
                <Link href="/formbasket" className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-sky-700">
                  <span className="h-1 w-1 rounded-full bg-sky-300 transition-all group-hover:w-3 group-hover:bg-sky-500" />
                  {t('footer.decisions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky-700">
              {t('footer.contact')}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <FaMapMarkerAlt className="text-xs" />
                </div>
                <span className="pt-0.5">Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <FaPhone className="text-xs" />
                </div>
                <span>+251 11 000 0000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <FaEnvelope className="text-xs" />
                </div>
                <span>shareholder@awashinsurance.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-sky-200/50 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {year} Awash Insurance S.C. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span className="cursor-default transition-colors hover:text-sky-700 dark:hover:text-slate-200">{t('footer.privacy')}</span>
            <span className="cursor-default transition-colors hover:text-sky-700 dark:hover:text-slate-200">{t('footer.terms')}</span>
            <span className="cursor-default transition-colors hover:text-sky-700 dark:hover:text-slate-200">{t('footer.support')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
