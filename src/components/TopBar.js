'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  FaHome,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaChartLine,
  FaUserPlus,
  FaShieldAlt,
} from 'react-icons/fa';

import {
  getStoredUser,
  logout,
  isStaffRole,
  isAdminRole,
  getRoleLabel,
} from '../libs/auth';

const navLinkClass = (active) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
    active
      ? 'bg-sky-50 text-sky-700 shadow-sm'
      : 'text-slate-600 hover:bg-sky-50/60 hover:text-sky-700'
  }`;

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Load authentication state only on the client
  useEffect(() => {
    setMounted(true);
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  const role = user?.role;
  const staff = isStaffRole(role);
  const admin = isAdminRole(role);

  const navItems = [
    { href: '/home', label: 'Home', icon: FaHome, show: true },
    { href: '/dashboard', label: 'My Dividend', icon: FaChartLine, show: true },
    { href: '/fillform', label: 'Fill Form', icon: FaFileInvoiceDollar, show: staff },
    { href: '/formbasket', label: 'Decisions', icon: FaClipboardList, show: staff },
    { href: '/register', label: 'Register Staff', icon: FaUserPlus, show: admin },
  ].filter((item) => item.show);

  const handleLogout = () => {
    setMobileOpen(false);
    setUser(null);
    logout(router);
  };

  // SSR skeleton — prevents hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/login" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Awash Insurance" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-base font-bold leading-tight text-slate-800">Awash Insurance</p>
              <p className="text-xs text-slate-500">Shareholder Portal</p>
            </div>
          </Link>
          <div className="h-9 w-24 rounded-lg bg-sky-50 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href={user ? '/home' : '/login'} className="flex items-center gap-3 group">
          <img src="/images/logo.png" alt="Awash Insurance" className="h-10 w-auto transition-transform group-hover:scale-105" />
          <div className="hidden sm:block">
            <p className="text-base font-bold leading-tight text-slate-800">Awash Insurance</p>
            <p className="text-xs text-slate-500">Shareholder Portal</p>
          </div>
        </Link>

        {/* Desktop navigation */}
        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={navLinkClass(pathname === href || pathname.startsWith(`${href}/`))}
              >
                <Icon className="text-sm" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* User controls */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden items-center gap-3 md:flex">
              {/* User badge */}
              <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-1.5 shadow-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                  <FaShieldAlt className="text-xs" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{user.username}</p>
                  <p className="text-xs font-medium text-sky-600">{getRoleLabel(role)}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-100 hover:text-red-700 hover:shadow"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-lg border border-sky-100 bg-sky-50/50 p-2 text-slate-700 transition hover:bg-sky-50 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="border-t border-sky-100 bg-gradient-to-b from-white to-sky-50/40 px-4 py-4 lg:hidden">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass(pathname === href || pathname.startsWith(`${href}/`))}
              >
                <Icon />
                {label}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
              <FaShieldAlt className="text-xs" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user.username}</p>
              <p className="text-xs font-medium text-sky-600">{getRoleLabel(role)}</p>
            </div>
          </div>

          {/* Mobile logout */}
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-100"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
