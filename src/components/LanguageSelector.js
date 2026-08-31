'use client';

import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaChevronDown, FaGlobeAfrica } from 'react-icons/fa';
import ReactCountryFlag from 'react-country-flag';
import { useTranslation } from './LanguageProvider';

const languages = [
  { code: 'en', country: 'GB', key: 'language.english' },
  { code: 'am', country: 'ET', key: 'language.amharic' },
  { code: 'om', country: 'ET', key: 'language.oromo' },
];

export default function LanguageSelector() {
  const { lang, setLang, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);
  const selectedLanguage = languages.find((language) => language.code === lang) || languages[0];

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (nextLanguage) => {
    setLang(nextLanguage);
    setOpen(false);
  };

  return (
    <div ref={selectorRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label="Language"
        aria-haspopup="listbox"
        aria-expanded={open}
        // className={`flex h-10 max-w-[8.5rem] items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold text-slate-600 shadow-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/40 dark:text-slate-200 sm:max-w-none sm:px-3 ${
        //   open
        //     ? 'border-blue-500 ring-2 ring-blue-500/20'
        //     : 'border-sky-100 hover:border-sky-300 dark:border-slate-700'
        // }`}
        className={`flex h-10 max-w-[8.5rem] items-center gap-2 rounded-xl border px-2.5 text-xs font-semibold outline-none transition-all duration-200 sm:max-w-none sm:px-3 ${
  open
    ? 'border-brand-secondary/50 bg-white/[0.08] text-white ring-2 ring-brand-secondary/20'
    : 'border-brand-secondary/25 bg-white/60 text-slate-700 hover:border-brand-secondary/50 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.08]'
}`}
      >
        {selectedLanguage.country ? (
          <ReactCountryFlag
            countryCode={selectedLanguage.country}
            svg
            className="shrink-0"
            style={{ width: '1.1em', height: '1.1em' }}
            aria-hidden="true"
          />
        ) : (
          <FaGlobeAfrica className="shrink-0 text-brand-secondary" aria-hidden="true" />
        )}
        <span className="min-w-0 truncate">{t(selectedLanguage.key)}</span>
        <FaChevronDown
          className={`shrink-0 text-[10px] text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            aria-label="Language"
            className="theme-surface absolute right-0 top-full z-50 mt-1.5 w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-lg border py-1 shadow-lg ring-1 ring-black/5 animate-[slideUp_0.15s_ease]"
          >
            <li className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
              Select language
            </li>
            {languages.map((language) => {
              const isSelected = language.code === lang;
              return (
                <li
                  key={language.code}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelect(language.code)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelect(language.code);
                    }
                  }}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150 focus:bg-brand-secondary-soft focus:outline-none dark:focus:bg-slate-700 ${
                    isSelected
                      ? 'bg-brand-secondary-soft font-semibold text-brand-secondary-hover dark:bg-slate-700 dark:text-brand-secondary'
                      : 'text-slate-700 hover:bg-brand-secondary-soft active:bg-brand-secondary/15 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language.country ? (
                    <ReactCountryFlag
                      countryCode={language.country}
                      svg
                      className="shrink-0"
                      style={{ width: '1.25em', height: '1.25em' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <FaGlobeAfrica className="shrink-0 text-brand-secondary" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{t(language.key)}</span>
                  {isSelected && <FaCheck className="shrink-0 text-xs text-brand-secondary" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
