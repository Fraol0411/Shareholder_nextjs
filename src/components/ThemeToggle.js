'use client';

import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from './ThemeProvider';
import { useTranslation } from './LanguageProvider';

export default function ThemeToggle({ variant = 'default' }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const className =
    variant === 'login'
      ? 'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-[#1a2332] dark:hover:text-white'
      : 'flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-brand-secondary-soft hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? t('theme.light') : t('theme.dark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? <FaSun className="h-4 w-4" /> : <FaMoon className="h-4 w-4" />}
    </button>
  );
}
