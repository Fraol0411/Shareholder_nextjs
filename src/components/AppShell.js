'use client';

import NavBar from './NavBar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import Container from './Container';

export default function AppShell({ children, className = '' }) {
  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-b from-sky-50/50 to-white dark:from-slate-900 dark:to-slate-950 ${className}`}>
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
