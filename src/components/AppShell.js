'use client';

import TopBar from './TopBar';
import Footer from './Footer';

export default function AppShell({ children, className = '' }) {
  return (
    <div className={`flex min-h-screen flex-col bg-slate-50 ${className}`}>
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
