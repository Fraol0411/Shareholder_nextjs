'use client';

import NavBar from './NavBar';
import Footer from './Footer';

export default function AppShell({ children, className = '' }) {
  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-b from-sky-50/50 to-white ${className}`}>
      <NavBar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
