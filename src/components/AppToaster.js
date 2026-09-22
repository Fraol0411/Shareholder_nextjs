'use client';

import { Toaster } from 'sonner';
import { useTheme } from './ThemeProvider';

export default function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="top-center"
      richColors
      closeButton
      expand
      duration={4500}
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border shadow-lg font-sans text-sm !gap-3',
          title: 'font-semibold',
          description: 'text-sm opacity-90',
          success: '!border-emerald-200 dark:!border-emerald-800',
          error: '!border-red-200 dark:!border-red-800',
          closeButton: 'border-slate-200 dark:border-slate-700',
        },
      }}
      style={{
        '--normal-bg': 'var(--surface)',
        '--normal-border': 'var(--border)',
        '--normal-text': 'var(--foreground)',
        '--success-bg': 'var(--surface)',
        '--error-bg': 'var(--surface)',
      }}
    />
  );
}
