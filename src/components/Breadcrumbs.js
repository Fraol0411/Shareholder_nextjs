'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronRight, FaHome } from 'react-icons/fa';
import { useTranslation } from './LanguageProvider';

const routeLabels = {
  '/home': 'nav.home',
  '/dashboard': 'nav.dashboard',
  '/devidenddetail': 'nav.dividend',
  '/fillform': 'nav.fillform',
  '/my-decisions': 'nav.decisions',
  '/staff-fillform': 'nav.fillform',
  '/formbasket': 'nav.decisions',
  '/dividendupload': 'upload.title',
  '/register': 'nav.register',
  '/profile': 'profile.title',
};

function getRouteLabel(pathname, t) {
  if (routeLabels[pathname]) return t(routeLabels[pathname]);
  if (pathname.startsWith('/manage-shareholders')) return t('breadcrumb.shareholders');
  if (pathname.startsWith('/formbasket/')) return t('breadcrumb.formDetails');
  return pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase()) || t('nav.home');
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isHome = pathname === '/home' || pathname === '/';

  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-200/80 py-2.5 text-xs dark:border-slate-700/70">
      <div className="flex items-center gap-2 overflow-x-auto">
        <Link
          href="/home"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/40 ${
            isHome
              ? 'text-slate-700 dark:text-slate-200'
              : 'text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-300'
          }`}
          aria-current={isHome ? 'page' : undefined}
        >
          <FaHome className="text-[11px] text-sky-600" aria-hidden="true" />
          {t('nav.home')}
        </Link>

        {!isHome && (
          <>
            <FaChevronRight className="shrink-0 text-[9px] text-slate-400" aria-hidden="true" />
            <span className="min-w-0 truncate rounded-md px-1.5 py-1 font-semibold text-slate-700 dark:text-slate-200" aria-current="page">
              {getRouteLabel(pathname, t)}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}
