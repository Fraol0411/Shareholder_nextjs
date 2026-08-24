// 'use client';

// import { useEffect, useState } from 'react';
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
//   FaShieldAlt,
//   FaChevronRight,
// } from 'react-icons/fa';

// import {
//   getStoredUser,
//   logout,
//   isStaffRole,
//   isAdminRole,
//   getRoleLabel,
// } from '../libs/auth';
// import Container from './Container';

// const navLinkClass = (active) =>
//   `relative flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-xl ${
//     active
//       ? 'text-blue-700 bg-blue-50/80 shadow-sm'
//       : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
//   }`;

// export default function TopBar() {
//   const router = useRouter();
//   const pathname = usePathname();

//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [user, setUser] = useState(null);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//     const storedUser = getStoredUser();
//     setUser(storedUser);
//   }, []);

//   const role = user?.role;
//   const staff = isStaffRole(role);
//   const admin = isAdminRole(role);

//   const navItems = [
//     { href: '/home', label: 'Home', icon: FaHome, show: true },
//     { href: '/devidenddetail', label: 'My Dividend', icon: FaChartLine, show: !staff },
//     { href: '/fillform', label: 'Fill Form', icon: FaFileInvoiceDollar, show: !staff },
//     { href: '/my-decisions', label: 'My Submissions', icon: FaClipboardList, show: !staff },
//     { href: '/staff-fillform', label: 'Fill Form (Staff)', icon: FaFileInvoiceDollar, show: staff },
//     { href: '/formbasket', label: 'All Decisions', icon: FaClipboardList, show: staff },
//     { href: '/register', label: 'Register Staff', icon: FaUserPlus, show: admin },
//   ].filter((item) => item.show);

//   const handleLogout = () => {
//     setMobileOpen(false);
//     setUser(null);
//     logout(router);
//   };

//   if (!mounted) {
//     return <div className="h-[73px] w-full border-b border-slate-100 bg-white" />;
//   }

//   return (
//     <header className="sticky top-0 z-[100] w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
//       <Container>
//         <div className="flex h-16 items-center justify-between gap-8">
          
//           {/* Logo Section */}
//           <Link href={user ? '/home' : '/login'} className="flex shrink-0 items-center gap-3 group">
//             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
//               <FaShieldAlt className="text-xl text-white" />
//             </div>
//             <div className="hidden sm:block">
//               <p className="text-sm font-black leading-tight tracking-tight text-slate-900 uppercase">
//                 አዋሽ ኢንሹራንስ
//               </p>
//               <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-80">
//                 Shareholder Portal
//               </p>
//             </div>
//           </Link>

//           {/* Desktop Nav - Middle */}
//           {user && (
//             <nav className="hidden items-center gap-1 lg:flex">
//               {navItems.map(({ href, label, icon: Icon }) => {
//                 const active = pathname === href || pathname.startsWith(`${href}/`);
//                 return (
//                   <Link key={href} href={href} className={navLinkClass(active)}>
//                     <Icon className={`text-base ${active ? 'text-blue-600' : 'text-slate-400'}`} />
//                     {label}
//                   </Link>
//                 );
//               })}
//             </nav>
//           )}

//           {/* User Section - Right */}
//           <div className="flex items-center gap-3">
//             {user && (
//               <>
//                 <div className="hidden items-center gap-4 md:flex">
//                   <div className="h-8 w-[1px] bg-slate-200" />
//                   <div className="flex items-center gap-3">
//                     <div className="text-right">
//                       <p className="text-sm font-bold text-slate-800 leading-none">{user.username}</p>
//                       <p className="mt-1 text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
//                         {getRoleLabel(role)}
//                       </p>
//                     </div>
//                     <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
//                        <FaShieldAlt className="text-slate-400 text-sm" />
//                     </div>
//                   </div>
                  
//                   <button
//                     onClick={handleLogout}
//                     className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-all hover:bg-red-600 hover:text-white shadow-sm"
//                     title="Logout"
//                   >
//                     <FaSignOutAlt />
//                   </button>
//                 </div>

//                 {/* Mobile Menu Toggle */}
//                 <button
//                   type="button"
//                   onClick={() => setMobileOpen(!mobileOpen)}
//                   className="inline-flex items-center justify-center rounded-xl bg-slate-100 p-2.5 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 lg:hidden"
//                 >
//                   {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </Container>

//       {/* 
//           MOBILE MENU OVERLAY 
//           Positioned 'absolute' so it floats over content without pushing it.
//       */}
//       {user && (
//         <div 
//           className={`absolute left-0 right-0 top-[65px] z-50 w-full overflow-hidden bg-white/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-in-out lg:hidden ${
//             mobileOpen ? 'max-h-[100vh] border-b border-slate-200 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
//           }`}
//         >
//           {/* Backdrop Blur Helper */}
//           <div className="p-4 space-y-2">
//             <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Navigation</p>
//             <nav className="space-y-1">
//               {navItems.map(({ href, label, icon: Icon }) => (
//                 <Link
//                   key={href}
//                   href={href}
//                   onClick={() => setMobileOpen(false)}
//                   className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
//                     pathname === href ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'
//                   }`}
//                 >
//                   <div className="flex items-center gap-3">
//                     <Icon className={pathname === href ? 'text-white' : 'text-slate-400'} />
//                     <span className="font-semibold text-sm">{label}</span>
//                   </div>
//                   <FaChevronRight className={`text-[10px] ${pathname === href ? 'text-white' : 'text-slate-300'}`} />
//                 </Link>
//               ))}
//             </nav>

//             {/* Mobile User Profile Section */}
//             <div className="mt-4 border-t border-slate-100 pt-4">
//                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
//                     <FaShieldAlt />
//                   </div>
//                   <div className="flex-1">
//                     <p className="text-sm font-bold text-slate-800">{user.username}</p>
//                     <p className="text-xs font-medium text-blue-600 uppercase tracking-tighter">{getRoleLabel(role)}</p>
//                   </div>
//                   <button
//                     onClick={handleLogout}
//                     className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
//                   >
//                     <FaSignOutAlt />
//                   </button>
//                </div>
//             </div>
            
//             {/* Slogan */}
//             <p className="mt-4 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
//                 Awash Insurance S.C. &copy; {new Date().getFullYear()}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Dark Overlay background when mobile menu is open */}
//       {mobileOpen && (
//         <div 
//           className="fixed inset-0 top-[65px] z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}
//     </header>
//   );
// }