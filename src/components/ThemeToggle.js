'use client';

import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-brand-secondary-soft hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <FaSun className="h-4 w-4" /> : <FaMoon className="h-4 w-4" />}
    </button>
  );
}
