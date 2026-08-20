// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import {
//   FaHome,
//   FaSignOutAlt,
//   FaBars,
//   FaTimes,
//   FaFileInvoiceDollar,
//   FaClipboardList,
//   FaChartLine,
//   FaUserPlus,
// } from 'react-icons/fa';
// import { getStoredUser, logout, isStaffRole, isAdminRole, getRoleLabel } from '../libs/auth';

// const navLinkClass = (active) =>
//   `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
//     active
//       ? 'bg-blue-50 text-blue-700'
//       : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
//   }`;

// export default function TopBar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const user = getStoredUser();
//   const role = user?.role;
//   const staff = isStaffRole(role);
//   const admin = isAdminRole(role);

//   const navItems = [
//     { href: '/home', label: 'Home', icon: FaHome, show: true },
//     { href: '/dashboard', label: 'My Dividend', icon: FaChartLine, show: true },
//     { href: '/fillform', label: 'Fill Form', icon: FaFileInvoiceDollar, show: staff },
//     { href: '/formbasket', label: 'Decisions', icon: FaClipboardList, show: staff },
//     { href: '/register', label: 'Register Staff', icon: FaUserPlus, show: admin },
//   ].filter((item) => item.show);

//   const handleLogout = () => {
//     setMobileOpen(false);
//     logout(router);
//   };

//   return (
//     <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
//       <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
//         <Link href={user ? '/home' : '/login'} className="flex items-center gap-3">
//           <img src="/images/logo.png" alt="Awash Insurance" className="h-10 w-auto" />
//           <div className="hidden sm:block">
//             <p className="text-base font-bold leading-tight text-slate-900">Awash Insurance</p>
//             <p className="text-xs text-slate-500">Shareholder Portal</p>
//           </div>
//         </Link>

//         {user && (
//           <nav className="hidden items-center gap-1 lg:flex">
//             {navItems.map(({ href, label, icon: Icon }) => (
//               <Link
//                 key={href}
//                 href={href}
//                 className={navLinkClass(pathname === href || pathname.startsWith(`${href}/`))}
//               >
//                 <Icon className="text-sm" />
//                 {label}
//               </Link>
//             ))}
//           </nav>
//         )}

//         <div className="flex items-center gap-3">
//           {user && (
//             <div className="hidden items-center gap-3 md:flex">
//               <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
//                 <p className="text-sm font-medium text-slate-800">{user.username}</p>
//                 <p className="text-xs text-blue-600">{getRoleLabel(role)}</p>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
//               >
//                 <FaSignOutAlt />
//                 Logout
//               </button>
//             </div>
//           )}

//           {user && (
//             <button
//               type="button"
//               onClick={() => setMobileOpen((open) => !open)}
//               className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
//               aria-label="Toggle menu"
//             >
//               {mobileOpen ? <FaTimes /> : <FaBars />}
//             </button>
//           )}
//         </div>
//       </div>

//       {user && mobileOpen && (
//         <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
//           <nav className="space-y-1">
//             {navItems.map(({ href, label, icon: Icon }) => (
//               <Link
//                 key={href}
//                 href={href}
//                 onClick={() => setMobileOpen(false)}
//                 className={navLinkClass(pathname === href)}
//               >
//                 <Icon />
//                 {label}
//               </Link>
//             ))}
//           </nav>
//           <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
//             <p className="text-sm font-medium text-slate-800">{user.username}</p>
//             <p className="text-xs text-blue-600">{getRoleLabel(role)}</p>
//           </div>
//           <button
//             onClick={handleLogout}
//             className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
//           >
//             <FaSignOutAlt />
//             Logout
//           </button>
//         </div>
//       )}
//     </header>
//   );
// }

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
} from 'react-icons/fa';

import {
  getStoredUser,
  logout,
  isStaffRole,
  isAdminRole,
  getRoleLabel,
} from '../libs/auth';

const navLinkClass = (active) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
    {
      href: '/home',
      label: 'Home',
      icon: FaHome,
      show: true,
    },
    {
      href: '/dashboard',
      label: 'My Dividend',
      icon: FaChartLine,
      show: true,
    },
    {
      href: '/fillform',
      label: 'Fill Form',
      icon: FaFileInvoiceDollar,
      show: staff,
    },
    {
      href: '/formbasket',
      label: 'Decisions',
      icon: FaClipboardList,
      show: staff,
    },
    {
      href: '/register',
      label: 'Register Staff',
      icon: FaUserPlus,
      show: admin,
    },
  ].filter((item) => item.show);

  const handleLogout = () => {
    setMobileOpen(false);
    setUser(null);
    logout(router);
  };

  /*
   * Important:
   * During SSR and the first client render, user is null.
   * This guarantees that both render the same HTML.
   *
   * After hydration, useEffect loads the actual user.
   */
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/login"
            className="flex items-center gap-3"
          >
            <img
              src="/images/logo.png"
              alt="Awash Insurance"
              className="h-10 w-auto"
            />

            <div className="hidden sm:block">
              <p className="text-base font-bold leading-tight text-slate-900">
                Awash Insurance
              </p>
              <p className="text-xs text-slate-500">
                Shareholder Portal
              </p>
            </div>
          </Link>

          <div className="h-9 w-24 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href={user ? '/home' : '/login'}
          className="flex items-center gap-3"
        >
          <img
            src="/images/logo.png"
            alt="Awash Insurance"
            className="h-10 w-auto"
          />

          <div className="hidden sm:block">
            <p className="text-base font-bold leading-tight text-slate-900">
              Awash Insurance
            </p>
            <p className="text-xs text-slate-500">
              Shareholder Portal
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={navLinkClass(
                  pathname === href || pathname.startsWith(`${href}/`)
                )}
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
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
                <p className="text-sm font-medium text-slate-800">
                  {user.username}
                </p>

                <p className="text-xs text-blue-600">
                  {getRoleLabel(role)}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          )}

          {user && (
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={navLinkClass(
                  pathname === href || pathname.startsWith(`${href}/`)
                )}
              >
                <Icon />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">
              {user.username}
            </p>

            <p className="text-xs text-blue-600">
              {getRoleLabel(role)}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      )}
    </header>
  );
}