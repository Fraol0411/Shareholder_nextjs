'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import Container from './Container';
import { useTranslation } from './LanguageProvider';

import { 
  HiOutlineHome, 
  HiOutlineChartBar, 
  HiOutlineDocumentText, 
  HiOutlineClipboardDocumentList, 
  HiOutlineUserPlus,
  HiOutlineArrowRightOnRectangle,
  HiChevronDown,
  HiBars3BottomRight,
  HiXMark,
  HiOutlineUserCircle
} from "react-icons/hi2";

import {
  getStoredUser,
  logout,
  isStaffRole,
  isAdminRole,
  getRoleLabel,
} from '../libs/auth';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  const userMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const role = user?.role;
  const staff = isStaffRole(role);
  const admin = isAdminRole(role);

  const navItems = [
    { href: '/home', label: 'nav.home', icon: HiOutlineHome, show: true },
    { href: '/devidenddetail', label: 'nav.dividend', icon: HiOutlineChartBar, show: !staff },
    { href: '/fillform', label: 'nav.fillform', icon: HiOutlineDocumentText, show: !staff },
    { href: '/my-decisions', label: 'nav.decisions', icon: HiOutlineClipboardDocumentList, show: !staff },
    { href: '/staff-fillform', label: 'nav.fillform', icon: HiOutlineDocumentText, show: staff },
    { href: '/formbasket', label: 'nav.decisions', icon: HiOutlineClipboardDocumentList, show: staff },
    { href: '/register', label: 'nav.register', icon: HiOutlineUserPlus, show: admin },
  ].filter((item) => item.show);

  const handleLogout = () => {
    setMobileOpen(false);
    logout(router);
  };

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  if (!mounted) return <div className="h-16 w-full bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800" />;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50">
        <Container>
          <div className="flex h-16 items-center justify-between gap-2">
            <Link
              href={user ? '/home' : '/login'}
              className="flex shrink-0 items-center gap-3 group"
            >
              <span className="flex h-8 items-center rounded-lg bg-transparent transition-transform group-hover:scale-102 dark:bg-white dark:shadow-sm">
                <img
                  src="/images/logo.png"
                  alt="Awash Insurance"
                  className="h-9 w-auto"
                />
              </span>
            </Link>

            {/* ── Desktop Links ── */}
            {user && (
              <div className="hidden lg:flex lg:items-center lg:gap-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all ${
                        active ? 'bg-[#233e90] text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {t(label)}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── Right Side Group ── */}
            <div className="flex items-center gap-1 sm:gap-2">
              
              {/* FIXED: Utilities now visible on mobile header */}
              <div className="flex items-center">
                <LanguageSelector />
                <ThemeToggle />
              </div>

              {user && (
                <div ref={userMenuRef} className="relative flex items-center">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center rounded-full bg-slate-50 dark:bg-slate-900 p-1 sm:pr-3 border border-transparent hover:border-blue-100 transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#233e90] text-[11px] font-bold text-white shadow-sm shrink-0">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    {/* Username hidden on small screens to save space */}
                    <span className="hidden sm:block ml-2 text-[13px] font-bold text-slate-700 dark:text-slate-100">
                      {user.username}
                    </span>
                    <HiChevronDown className="hidden sm:block ml-1 w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-52 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{getRoleLabel(role)}</p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-lg">
                          <HiOutlineUserCircle size={18} /> {t('profile.title')}
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg text-left">
                          <HiOutlineArrowRightOnRectangle size={18} /> {t('nav.signout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Hamburger */}
              {user && (
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="lg:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  {mobileOpen ? <HiXMark size={24} /> : <HiBars3BottomRight size={24} />}
                </button>
              )}
            </div>
          </div>
        </Container>

        {/* ── Mobile Menu Dropdown ── */}
        {mobileOpen && user && (
          <div className="lg:hidden absolute w-full bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 p-4 space-y-2 shadow-2xl">
             {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-semibold ${
                    isActive(href) ? 'bg-[#233e90] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(label)}
                </Link>
             ))}

             <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg text-left">
                          <HiOutlineArrowRightOnRectangle size={18} /> {t('nav.signout')}
                        </button>
          </div>
        )}
      </nav>
    </>
  );
}