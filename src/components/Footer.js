'use client';

import Link from 'next/link';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa';
import { useTranslation } from './LanguageProvider';
import Container from './Container';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-brand-secondary/20 bg-gradient-to-br from-brand-secondary-soft via-white to-brand-primary-soft/40 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <Container className="py-7 sm:py-9">
        <div className="grid gap-7 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 items-center rounded-lg bg-transparent px-1 dark:bg-white dark:shadow-sm">
                <img src="/images/logo.png" alt="Awash Insurance" className="h-9 w-auto" />
              </span>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">Awash Insurance</p>
                <p className="text-xs font-medium text-brand-secondary-hover dark:text-brand-secondary">{t('footer.portalSubtitle')}</p>
              </div>
            </div>
            <p className="mt-3 max-w-md text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm sm:leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary dark:text-brand-secondary">
              {t('footer.quicklinks')}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/home" className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-brand-primary dark:text-slate-300 dark:hover:text-brand-secondary">
                  <span className="h-1 w-1 rounded-full bg-brand-secondary transition-all group-hover:w-3 group-hover:bg-brand-primary" />
                  {t('footer.portalHome')}
                </Link>
              </li>
              <li>
                <Link href="/devidenddetail" className="group flex items-center gap-2 text-slate-600 transition-colors hover:text-brand-primary dark:text-slate-300 dark:hover:text-brand-secondary">
                  <span className="h-1 w-1 rounded-full bg-brand-secondary transition-all group-hover:w-3 group-hover:bg-brand-primary" />
                  {t('footer.checkDividend')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary dark:text-brand-secondary">
              {t('footer.contact')}
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-secondary-soft text-brand-secondary-hover dark:bg-slate-800 dark:text-brand-secondary">
                  <FaMapMarkerAlt className="text-xs" />
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=9.014764793341104,%2038.75101186069247"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md pt-0.5 transition-colors hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 dark:hover:text-brand-secondary"
                >
                  Ras Abebe Aregay Street, Mexico, Addis Ababa, Ethiopia
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-secondary-soft text-brand-secondary-hover dark:bg-slate-800 dark:text-brand-secondary">
                  <FaPhone className="text-xs" />
                </div>
                <a
                  href="tel:+251115570001"
                  className="rounded-md transition-colors hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 dark:hover:text-brand-secondary"
                >
                  +251 115 570 001
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-secondary-soft text-brand-secondary-hover dark:bg-slate-800 dark:text-brand-secondary">
                  <FaEnvelope className="text-xs" />
                </div>
                <a
                  href="mailto:aic@awashinsurance.com"
                  className="break-all rounded-md transition-colors hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 dark:hover:text-brand-secondary"
                >
                  aic@awashinsurance.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-brand-secondary/20 pt-4 dark:border-slate-700 sm:flex-row sm:gap-4 sm:pt-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            © {year} Awash Insurance S.C. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 sm:gap-6 sm:text-sm">
            <span className="cursor-default transition-colors hover:text-brand-primary dark:hover:text-slate-200">{t('footer.privacy')}</span>
            <span className="cursor-default transition-colors hover:text-brand-primary dark:hover:text-slate-200">{t('footer.terms')}</span>
            <span className="cursor-default transition-colors hover:text-brand-primary dark:hover:text-slate-200">{t('footer.support')}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
