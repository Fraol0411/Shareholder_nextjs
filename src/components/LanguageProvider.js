'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import en from '../locales/en.json';
import am from '../locales/am.json';
import om from '../locales/om.json';

const dictionaries = { en, am, om };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const savedLang = window.localStorage.getItem('locale');
    if (savedLang && dictionaries[savedLang]) setLangState(savedLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem('locale', lang);
    document.cookie = `locale=${lang}; path=/; max-age=31536000; samesite=lax`;
  }, [lang]);

  const setLang = (nextLang) => {
    if (dictionaries[nextLang]) setLangState(nextLang);
  };

  const t = (key) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
}
