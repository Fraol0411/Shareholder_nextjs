'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  FaHome,
  FaSignOutAlt,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaChartLine,
  FaUserPlus,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

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

  const userMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const role = user?.role;
  const staff = isStaffRole(role);
  const admin = isAdminRole(role);

  const navItems = [
    { href: '/home', label: 'Home', icon: FaHome, show: true },
    { href: '/devidenddetail', label: 'My Dividend', icon: FaChartLine, show: !staff },
    { href: '/fillform', label: 'Fill Form', icon: FaFileInvoiceDollar, show: !staff },
    { href: '/my-decisions', label: 'My Submissions', icon: FaClipboardList, show: !staff },
    { href: '/staff-fillform', label: 'Fill Form (Staff)', icon: FaFileInvoiceDollar, show: staff },
    { href: '/formbasket', label: 'All Decisions', icon: FaClipboardList, show: staff },
    { href: '/register', label: 'Register Staff', icon: FaUserPlus, show: admin },
  ].filter((item) => item.show);

  const handleLogout = () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setUser(null);
    logout(router);
  };

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  /* ── SSR skeleton ── */
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-sky-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-100 animate-pulse" />
            <div className="h-5 w-28 rounded bg-sky-100 animate-pulse" />
          </div>
          <div className="h-9 w-20 rounded-lg bg-sky-100 animate-pulse" />
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-sky-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* ── Logo ── */}
            <Link
              href={user ? '/home' : '/login'}
              className="flex shrink-0 items-center gap-3 group"
            >
              <img
                src="/images/logo.png"
                alt="Awash Insurance"
                className="h-9 w-auto transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="block text-base font-bold leading-tight text-slate-800">
                  Awash Insurance
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-sky-600">
                  Shareholder Portal
                </span>
              </div>
            </Link>

            {/* ── Desktop Nav Links ── */}
            {user && (
              <div className="hidden lg:flex lg:items-center lg:gap-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-sky-50 text-sky-700 shadow-sm'
                          : 'text-slate-600 hover:bg-sky-50/60 hover:text-sky-700'
                      }`}
                    >
                      <Icon className={`text-xs ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── Right Side ── */}
            <div className="flex items-center gap-2">
              {/* Desktop User Menu */}
              {user && (
                <div ref={userMenuRef} className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition-all hover:bg-sky-50/80"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                      {user.username?.split(' ').map((n) => n.charAt(0).toUpperCase()).join('') || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold leading-none text-slate-800">{user.username}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-sky-600">{getRoleLabel(role)}</p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-xl shadow-sky-100/30 ring-1 ring-black/5">
                        <div className="border-b border-sky-50 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
                          <p className="mt-0.5 text-xs font-medium text-sky-600">{getRoleLabel(role)}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/home"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-sky-50"
                          >
                            <FaHome className="text-xs text-slate-400" />
                            Home
                          </Link>
                        </div>
                        <div className="border-t border-sky-50 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                          >
                            <FaSignOutAlt className="text-xs" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mobile Hamburger */}
              {user && (
                <button
                  type="button"
                  onClick={() => setMobileOpen((o) => !o)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 lg:hidden"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {user && (
          <div
            className={`overflow-hidden border-t border-sky-100/60 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-in-out lg:hidden ${
              mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-1 px-4 py-3">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }`}
                  >
                    <Icon className={active ? 'text-white' : 'text-slate-400'} />
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile User Section */}
            <div className="border-t border-sky-100/60 px-4 py-3">
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow">
                  {user.username?.split(' ').map((n) => n.charAt(0).toUpperCase()).join('') || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{user.username}</p>
                  <p className="text-xs font-medium text-sky-600">{getRoleLabel(role)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
                  title="Logout"
                >
                  <FaSignOutAlt className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Dark overlay behind mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
