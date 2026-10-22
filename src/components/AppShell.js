'use client';

import { useEffect, useState } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import Container from './Container';
import OpsShell from './OpsShell';
import { Spinner } from './ui/loading';
import { getStoredUser, isStaffRole } from '../libs/auth';

/**
 * Shareholder pages keep the top header.
 * Staff/admin pages use a shadcn-style operations sidebar.
 *
 * Which of the two it is depends on the profile in localStorage, so the server cannot
 * answer and the first client render has to match the server anyway. That answer is
 * remembered here (module scope outlives a page change) because every page mounts its
 * own AppShell: without it, clicking between pages tore the header and the operations
 * rail out of the DOM and showed a full-page spinner in their place. Now the chrome is
 * resolved once, and only the content of a page waits on the server.
 */
let resolvedMode = null; // 'ops' | 'shareholder', known after the first client render

export default function AppShell({ children, className = '', forceShareholder = false }) {
  // A page that asks for the shareholder chrome does not need to look anything up, so
  // it can render straight away; the rest start as 'loading' only until the mode is
  // known (one placeholder per browser load, never per navigation).
  const [mode, setMode] = useState(
    () => (forceShareholder ? 'shareholder' : resolvedMode || 'loading')
  );

  useEffect(() => {
    const user = getStoredUser();
    const next = !forceShareholder && isStaffRole(user?.role) ? 'ops' : 'shareholder';
    resolvedMode = next;
    setMode(next);
  }, [forceShareholder]);

  if (mode === 'loading') {
    // Still the shell, not a bare spinner over an empty window: the page keeps the
    // shareholder header while the profile is being read, so the swap to the
    // operations rail is the only thing that can move.
    return (
      <div className={`flex min-h-screen flex-col bg-gradient-to-b from-brand-secondary-soft/55 via-white to-brand-primary-soft/25 dark:from-slate-900 dark:via-slate-950 dark:to-brand-primary-soft/30 ${className}`}>
        <NavBar />
        <main className="flex w-full min-w-0 flex-1 items-center justify-center pt-16">
          <Spinner />
        </main>
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
