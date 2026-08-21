'use client';

import TopBar from './TopBar';
import Footer from './Footer';

export default function AppShell({ children, className = '' }) {
  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-b from-sky-50/50 to-white ${className}`}>
      <TopBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
