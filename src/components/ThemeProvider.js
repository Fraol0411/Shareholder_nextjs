'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function getStoredTheme() {
  // Light is the house style, so the operating system's colour scheme is
  // deliberately not consulted. Only the theme toggle (or a value it stored on an
  // earlier visit) can put the portal in dark mode.
  return window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(nextTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', nextTheme === 'dark');
  root.style.colorScheme = nextTheme;
}

export function ThemeProvider({ children }) {
  // Always start as light so the server HTML and the first client render match.
  // The stored preference is applied right after mount (the boot script already set
  // the document class, so a dark-mode user does not see a light frame).
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (nextTheme) => {
    const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
    window.localStorage.setItem('theme', normalizedTheme);
    setThemeState(normalizedTheme);
    applyTheme(normalizedTheme);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
