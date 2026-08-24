'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import Container from './Container';
import { useTranslation } from './LanguageProvider';

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
  const { t } = useTranslation();

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
    { href: '/home', label: 'nav.home', icon: FaHome, show: true },
    { href: '/devidenddetail', label: 'nav.dividend', icon: FaChartLine, show: !staff },
    { href: '/fillform', label: 'nav.fillform', icon: FaFileInvoiceDollar, show: !staff },
    { href: '/my-decisions', label: 'nav.decisions', icon: FaClipboardList, show: !staff },
    { href: '/staff-fillform', label: 'nav.fillform', icon: FaFileInvoiceDollar, show: staff },
    { href: '/formbasket', label: 'nav.decisions', icon: FaClipboardList, show: staff },
    { href: '/register', label: 'nav.register', icon: FaUserPlus, show: admin },
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
      <nav className="bg-white dark:bg-slate-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-slate-700">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-sky-100 animate-pulse" />
              <div className="h-5 w-28 rounded bg-sky-100 animate-pulse" />
            </div>
            <div className="h-9 w-20 rounded-lg bg-sky-100 animate-pulse" />
          </div>
        </Container>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-sky-100/80 bg-white/90 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/90">
        <Container>
          <div className="flex h-16 items-center justify-between">

            {/* ── Logo ── */}
            <Link
              href={user ? '/home' : '/login'}
              className="flex shrink-0 items-center gap-3 group"
            >
              <span className="flex h-10 items-center rounded-lg bg-transparent px-1.5 transition-transform group-hover:scale-105 dark:bg-white dark:shadow-sm">
                <img
                  src="/images/logo.png"
                  alt="Awash Insurance"
                  className="h-9 w-auto"
                />
              </span>
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
                          ? 'bg-sky-50 text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300'
                          : 'text-slate-600 hover:bg-sky-50/60 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300'
                      }`}
                    >
                      <Icon className={`text-xs ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                      {t(label)}
                    </Link>
                  );
                })}
              </div>
            )}

          <div 
          className="flex items-center gap-1"
          
          >
            <LanguageSelector />
            <ThemeToggle />
          </div>

            {/* ── Right Side ── */}
            <div className="flex items-center gap-2">
              {/* Desktop User Menu */}
              {user && (
                <div ref={userMenuRef} className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                            className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition-all hover:bg-sky-50/80 dark:hover:bg-slate-800 dark:hover:ring-slate-700"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                      {user.username?.split(' ').map((n) => n.charAt(0).toUpperCase()).join('') || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold leading-none text-slate-800 dark:text-slate-100">{user.username}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-sky-600">{getRoleLabel(role)}</p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl dark:bg-slate-800 border border-sky-100 dark:border-slate-700 bg-white shadow-xl shadow-sky-100/30 ring-1 ring-black/5">
                        <div className="border-b border-sky-50 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user.username}</p>
                          <p className="mt-0.5 text-xs font-medium text-sky-600">{getRoleLabel(role)}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/home"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors hover:bg-sky-50"
                          >
                            <FaHome className="text-xs text-slate-400" />
                            {t('nav.home')}
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            <FaUserPlus className="text-xs text-slate-400" />
                            {t('profile.title')}
                          </Link>
                        </div>
                        <div className="border-t border-sky-50 dark:border-slate-700 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors hover:bg-red-50"
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

              {/* Mobile Hamburger */}
              {user && (
                <button
                  type="button"
                  onClick={() => setMobileOpen((o) => !o)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300 lg:hidden"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
              )}
            </div>
          </div>
        </Container>

        {/* ── Mobile Menu ── */}
        {user && (
          <div
            className={`overflow-hidden border-t border-sky-200/70 bg-gradient-to-b from-sky-50/95 to-white/95 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-slate-700/80 dark:from-slate-900/98 dark:to-slate-950/98 dark:shadow-black/20 lg:hidden ${
              mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <Container className="py-3">
              <div className="space-y-1.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                        : 'text-slate-700 hover:bg-white hover:text-sky-700 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300'
                    }`}
                  >
                    <Icon className={active ? 'text-white' : 'text-slate-400'} />
                    {t(label)}
                  </Link>
                );
              })}
              </div>

              {/* Mobile User Section */}
              <div className="mt-3 border-t border-sky-200/70 pt-3 dark:border-slate-700/80">
              <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-white/80 p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow">
                  {user.username?.split(' ').map((n) => n.charAt(0).toUpperCase()).join('') || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user.username}</p>
                  <p className="text-xs font-medium text-sky-600">{getRoleLabel(role)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-9 w-30 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 dark:hover:text-red-200"
                  title="Logout"
                >
                  <p  className="text-sm font-medium mx-2">{t('nav.logout')}</p>
                  <FaSignOutAlt className="text-sm" />
                </button>
              </div>
              </div>
            </Container>
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


// 'use client';

// import { useEffect, useState, useRef } from 'react';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import ThemeToggle from './ThemeToggle';
// import LanguageSelector from './LanguageSelector';
// import Container from './Container';
// import { useTranslation } from './LanguageProvider';

// // Modern stroke icons (Heroicons)
// import { 
//   HiOutlineHome, 
//   HiOutlineChartBar, 
//   HiOutlineDocumentText, 
//   HiOutlineClipboardDocumentList, 
//   HiOutlineUserPlus,
//   HiOutlineArrowRightOnRectangle,
//   HiChevronDown,
//   HiBars3BottomRight,
//   HiXMark,
//   HiOutlineUserCircle
// } from "react-icons/hi2";

// import {
//   getStoredUser,
//   logout,
//   isStaffRole,
//   isAdminRole,
//   getRoleLabel,
// } from '../libs/auth';

// export default function NavBar() {
//   const router = useRouter();
//   const pathname = usePathname();

//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const [user, setUser] = useState(null);
//   const [mounted, setMounted] = useState(false);
//   const { t } = useTranslation();

//   const userMenuRef = useRef(null);

//   useEffect(() => {
//     setMounted(true);
//     setUser(getStoredUser());
//   }, []);

//   // Close user menu on outside click
//   useEffect(() => {
//     if (!userMenuOpen) return;
//     const handler = (e) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [userMenuOpen]);

//   // Close mobile menu on route change
//   useEffect(() => {
//     setMobileOpen(false);
//   }, [pathname]);

//   const role = user?.role;
//   const staff = isStaffRole(role);
//   const admin = isAdminRole(role);

//   const navItems = [
//     { href: '/home', label: 'nav.home', icon: HiOutlineHome, show: true },
//     { href: '/devidenddetail', label: 'nav.dividend', icon: HiOutlineChartBar, show: !staff },
//     { href: '/fillform', label: 'nav.fillform', icon: HiOutlineDocumentText, show: !staff },
//     { href: '/my-decisions', label: 'nav.decisions', icon: HiOutlineClipboardDocumentList, show: !staff },
//     { href: '/staff-fillform', label: 'nav.fillform', icon: HiOutlineDocumentText, show: staff },
//     { href: '/formbasket', label: 'nav.decisions', icon: HiOutlineClipboardDocumentList, show: staff },
//     { href: '/register', label: 'nav.register', icon: HiOutlineUserPlus, show: admin },
//   ].filter((item) => item.show);

//   const handleLogout = () => {
//     setUserMenuOpen(false);
//     logout(router);
//   };

//   const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

//   if (!mounted) return <div className="h-16 w-full bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800" />;

//   return (
//     <>
//       <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
//         <Container>
//           <div className="flex h-16 items-center justify-between">
            
//             {/* ── Logo Section ── */}
//             <Link href={user ? '/home' : '/login'} className="flex shrink-0 items-center group">
//               <img 
//                 src="/images/logo.png" 
//                 alt="Awash Insurance" 
//                 className="h-8 w-auto transition-transform duration-300 group-hover:scale-105" 
//               />
//             </Link>

//             {/* ── Desktop Navigation (Modern Pills) ── */}
//             {user && (
//               <div className="hidden lg:flex items-center gap-1.5">
//                 {navItems.map(({ href, label, icon: Icon }) => {
//                   const active = isActive(href);
//                   return (
//                     <Link
//                       key={href}
//                       href={href}
//                       className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 ${
//                         active
//                           ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
//                           : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800'
//                       }`}
//                     >
//                       <Icon className={`w-4 h-4 ${active ? 'opacity-100' : 'opacity-70'}`} />
//                       {t(label)}
//                     </Link>
//                   );
//                 })}
//               </div>
//             )}

//             {/* ── Right Utilities ── */}
//             <div className="flex items-center gap-3">
//               <div className="hidden md:flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-3">
//                 <LanguageSelector />
//                 <ThemeToggle />
//               </div>

//               {/* User Profile Dropdown */}
//               {user && (
//                 <div ref={userMenuRef} className="relative">
//                   <button
//                     onClick={() => setUserMenuOpen(!userMenuOpen)}
//                     className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 border border-transparent hover:border-blue-100 transition-all"
//                   >
//                     {/* Circular Avatar aligned with body color */}
//                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
//                       {user.username?.charAt(0).toUpperCase() || 'U'}
//                     </div>
//                     <div className="hidden sm:block text-left">
//                       <p className="text-[13px] font-bold text-slate-700 dark:text-slate-100 leading-none">{user.username}</p>
//                     </div>
//                     <HiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
//                   </button>

//                   {userMenuOpen && (
//                     <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none animate-in fade-in slide-in-from-top-2">
//                       <div className="px-4 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
//                         <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.username}</p>
//                         <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 mt-1">{getRoleLabel(role)}</p>
//                       </div>
//                       <div className="p-1.5">
//                         <Link 
//                           href="/profile" 
//                           onClick={() => setUserMenuOpen(false)}
//                           className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
//                         >
//                           <HiOutlineUserCircle className="w-5 h-5 opacity-70" />
//                           {t('profile.title')}
//                         </Link>
//                         <button 
//                           onClick={handleLogout} 
//                           className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
//                         >
//                           <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
//                           {t('nav.signout')}
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Mobile Menu Toggle */}
//               {user && (
//                 <button
//                   onClick={() => setMobileOpen(!mobileOpen)}
//                   className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//                 >
//                   {mobileOpen ? <HiXMark size={24} /> : <HiBars3BottomRight size={24} />}
//                 </button>
//               )}
//             </div>
//           </div>
//         </Container>

//         {/* ── Mobile Menu Overlay ── */}
//         {mobileOpen && user && (
//           <div className="lg:hidden absolute w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-4">
//              {navItems.map(({ href, label, icon: Icon }) => (
//                 <Link
//                   key={href}
//                   href={href}
//                   className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold transition-all ${
//                     isActive(href) 
//                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
//                     : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
//                   }`}
//                 >
//                   <Icon className="w-5 h-5" />
//                   {t(label)}
//                 </Link>
//              ))}
//              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-2">
//                 <div className="flex gap-2">
//                   <LanguageSelector />
//                   <ThemeToggle />
//                 </div>
//                 <button onClick={handleLogout} className="text-sm font-bold text-red-500 px-3 py-2">
//                   {t('nav.signout')}
//                 </button>
//              </div>
//           </div>
//         )}
//       </nav>

//       {/* Transparent spacer to prevent content overlap */}
//       <div className="h-16" /> 
//     </>
//   );
// }