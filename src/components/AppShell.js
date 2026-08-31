'use client';

import NavBar from './NavBar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import Container from './Container';

export default function AppShell({ children, className = '' }) {
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
