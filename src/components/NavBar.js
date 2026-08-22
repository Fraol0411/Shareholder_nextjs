'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ReactCountryFlag from 'react-country-flag';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from './LanguageProvider';

import {
  FaHome,
  FaSignOutAlt,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaChartLine,
  FaUserPlus,
  FaShieldAlt,
  FaCheck,
  FaChevronDown,
} from 'react-icons/fa';

import {
  getStoredUser,
  logout,
  isStaffRole,
  isAdminRole,
  getRoleLabel,
} from '../libs/auth';

/* ─── Language options ─── */
const languages = [
  { code: 'en', label: 'English (US)', flag: 'US' },
  { code: 'am', label: 'አማርኛ', flag: 'ET' },
  { code: 'om', label: 'Oromo', flag: 'ET' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { lang, setLang, t } = useTranslation();

  const langRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load auth state on client only
  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [langOpen]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [userMenuOpen]);

  const role = user?.role;
  const staff = isStaffRole(role);
  const admin = isAdminRole(role);

  const navItems = [
    { href: '/home', label: t('nav.home'), icon: FaHome, show: true },
    { href: '/devidenddetail', label: t('nav.dividend'), icon: FaChartLine, show: true },
    { href: '/dashboard', label: t('nav.dashboard'), icon: FaFileInvoiceDollar, show: true },
    { href: '/fillform', label: t('nav.fillform'), icon: FaFileInvoiceDollar, show: staff },
    { href: '/formbasket', label: t('nav.decisions'), icon: FaClipboardList, show: staff },
    { href: '/register', label: t('nav.register'), icon: FaUserPlus, show: admin },
  ].filter((item) => item.show);

  const handleLogout = () => {
    setMobileOpen(false);
    setUser(null);
    logout(router);
  };

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const activeLang = languages.find((l) => l.code === lang) || languages[0];

  /* ── SSR skeleton — prevents hydration mismatch ── */
  if (!mounted) {
    return (
      <nav className="bg-white dark:bg-slate-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-screen-xl flex items-center justify-between mx-auto p-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded bg-gray-100 animate-pulse" />
            <div className="h-5 w-28 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-black/20 transition-colors duration-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">

        {/* ── Logo ── */}
        <Link
          href={user ? '/home' : '/login'}
          className="flex items-center space-x-3 rtl:space-x-reverse group"
        >
          <img
            src="/images/logo.png"
            alt="Awash Insurance"
            className="h-8 transition-transform group-hover:scale-105"
          />
          <span className="self-center text-xl text-gray-900 dark:text-slate-100 font-semibold whitespace-nowrap hidden sm:inline">
            Awash Insurance
          </span>
        </Link>

        {/* ── Right-side controls ── */}
        <div className="flex items-center md:order-2 space-x-1 md:space-x-2 rtl:space-x-reverse">

          {/* Language dropdown */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center text-gray-700 dark:text-slate-200 bg-transparent border border-transparent hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-4 focus:ring-gray-200 dark:focus:ring-slate-700 font-medium leading-5 rounded-lg text-sm px-2.5 py-2 focus:outline-none transition-colors"
            >
              <ReactCountryFlag
                countryCode={activeLang.flag}
                svg
                style={{ width: '1em', height: '1em' }}
                className="me-1.5"
                aria-label={activeLang.label}
              />
              <span className="hidden sm:inline text-xs font-medium">
                {lang === 'am' ? t('language.amharic') : lang === 'om' ? t('language.oromo') : t('language.english')}
              </span>
              <FaChevronDown className={`w-3 h-3 ms-1.5 text-gray-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute z-50 top-full right-0 mt-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg w-44 animate-[slideUp_0.15s_ease]">
                  <ul className="p-1.5 text-sm text-gray-600 dark:text-slate-300 font-medium" role="menu">
                    {languages.map((l) => {
                      const isActiveLang = l.code === lang;
                      return (
                        <li key={l.code}>
                          <button
                            type="button"
                            onClick={() => { setLang(l.code); setLangOpen(false); }}
                            className={`flex items-center w-full p-2 rounded-md transition-colors ${
                              isActiveLang
                                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white text-gray-600 dark:text-gray-300'
                            }`}
                            role="menuitem"
                          >
                            <ReactCountryFlag
                              countryCode={l.flag}
                              svg
                              style={{ width: '1em', height: '1em' }}
                              className="me-2"
                              aria-label={l.label}
                            />
                            <span className="flex-1 text-left">
                              {l.code === 'am' ? t('language.amharic') : l.code === 'om' ? t('language.oromo') : t('language.english')}
                            </span>
                            {isActiveLang && <FaCheck className="w-3 h-3 text-blue-600" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>

          <ThemeToggle />

          {/* User avatar menu (desktop) */}
          {user && (
            <div ref={userMenuRef} className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                        className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-gray-200 dark:hover:ring-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold shadow-sm">
                  {user.username?.split(' ').map((name) => name.charAt(0).toUpperCase()).join('') || 'U'}
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute z-50 top-full right-0 mt-1.5 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg ring-1 ring-black/5 animate-[slideUp_0.15s_ease]">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.username}</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{getRoleLabel(role)}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/home"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <FaHome className="text-xs text-gray-400" />
                        {t('nav.home')}
                      </Link>
                    </div>

                    {/* Divider + Logout */}
                    <div className="border-t border-gray-100 dark:border-slate-700 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <FaSignOutAlt className="text-xs" />
                        {t('nav.signout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hamburger (mobile) */}
          {user && (
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 dark:text-slate-300 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700 transition-colors"
              aria-controls="navbar-main"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">{t('nav.openMenu')}</span>
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M5 12h14M5 17h14" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* ── Desktop nav links ── */}
        {user && (
          <div
            className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
            id="navbar-main"
          >
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 md:flex-row md:space-x-1 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-transparent">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors md:p-2 md:hover:bg-gray-100 ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold md:bg-blue-50 md:dark:bg-blue-950/60 md:text-blue-700 md:dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="text-xs" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ── Mobile menu ── */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pb-4 pt-3 animate-[slideUp_0.15s_ease]">
          {/* Nav links */}
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="text-sm" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User info + logout */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-slate-800 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
                <FaShieldAlt className="text-xs" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.username}</p>
                <p className="text-xs font-medium text-blue-600">{getRoleLabel(role)}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-950/70"
            >
              <FaSignOutAlt />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
