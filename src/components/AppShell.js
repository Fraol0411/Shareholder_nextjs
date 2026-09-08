'use client';

import { useEffect, useState } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import Container from './Container';
import OpsShell from './OpsShell';
import { getStoredUser, isStaffRole } from '../libs/auth';

/**
 * Shareholder pages keep the top header.
 * Staff/admin pages use a shadcn-style operations sidebar.
 */
export default function AppShell({ children, className = '', forceShareholder = false }) {
  const [mode, setMode] = useState('loading'); // loading | ops | shareholder

  useEffect(() => {
    const user = getStoredUser();
    if (!forceShareholder && isStaffRole(user?.role)) {
      setMode('ops');
    } else {
      setMode('shareholder');
    }
  }, [forceShareholder]);

  if (mode === 'loading') {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-secondary-soft/55 via-white to-brand-primary-soft/25 dark:from-slate-900 dark:via-slate-950 dark:to-brand-primary-soft/30 ${className}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
      </div>
    );
  }

  if (mode === 'ops') {
    return <OpsShell className={className}>{children}</OpsShell>;
  }

  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-b from-brand-secondary-soft/55 via-white to-brand-primary-soft/25 dark:from-slate-900 dark:via-slate-950 dark:to-brand-primary-soft/30 ${className}`}>
      <NavBar />
      <main className="w-full min-w-0 flex-1 pt-16">
        <Container>
          <Breadcrumbs />
          {children}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
