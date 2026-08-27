'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaCalendarAlt, FaWallet, FaChartLine, FaHistory, FaMoneyBillWave, 
  FaUser, FaIdCard, FaPhone, FaExclamationTriangle, FaBuilding,
  FaHashtag, FaPrint, FaCheck
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { useTranslation } from '../../components/LanguageProvider';

/* ─── Format number helper ─── */
const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DividendDetail() {
  const { t } = useTranslation();
  const [regNo, setRegNo] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedRegNo = localStorage.getItem('reg_no');
    if (storedRegNo) {
      setRegNo(storedRegNo);
      fetchDetails(storedRegNo, '');
    } else {
      setIsLoading(false);
      setError('User registration number not found. Please log in again.');
    }
  }, []);

  const fetchDetails = async (currentRegNo, year) => {
    setIsLoading(true);
    setError('');
    try {
      const url = year
        ? `/api/dividend-detail?reg_no=${encodeURIComponent(currentRegNo)}&fiscal_year=${encodeURIComponent(year)}`
        : `/api/dividend-detail?reg_no=${encodeURIComponent(currentRegNo)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();

      setFiscalYears(data.fiscalYears || []);

      if (!year && data.fiscalYears && data.fiscalYears.length > 0) {
        const firstYear = data.fiscalYears[0];
        setSelectedYear(firstYear);
        fetchDetails(currentRegNo, firstYear);
        return;
      }

      if (data.records && data.records.length > 0) {
        setRecord(data.records[0]);
      } else {
        setRecord(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    if (regNo && year) fetchDetails(regNo, year);
  };

  const handlePrint = useCallback(() => window.print(), []);

  return (
    <AppShell>
      <div className="py-5 sm:py-8">
        {/* ── Header ── */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {t('detail.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs sm:text-sm">
              {t('detail.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Fiscal Year Dropdown */}
            <FiscalYearDropdown
              years={fiscalYears}
              selected={selectedYear}
              onSelect={handleYearSelect}
            />

            {/* Print button */}
            {record && (
              <button
                onClick={handlePrint}
                title="Print record"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white dark:hover:border-slate-600"
              >
                <FaPrint className="text-xs" />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}
          </div>
        </div>

        {/* ── States ── */}
        {isLoading ? (
          <SkeletonLayout />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 flex items-start gap-3 text-red-700 dark:bg-red-950/40 dark:border-red-900/70 dark:text-red-300">
            <div className="p-1.5 bg-red-100 rounded-lg shrink-0 dark:bg-red-900/60">
              <FaExclamationTriangle className="text-sm" />
            </div>
            <div>
              <p className="font-semibold text-sm text-red-800 dark:text-red-200">Something went wrong</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
        ) : !record ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* ── Hero: Total Dividend ── */}
            <HeroTotalCard value={record.total_dividend} t={t} />

            {/* ── Metric Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <MetricCard label={t('detail.paidCapital')} value={record.paidup_capital} icon={FaWallet} accent="blue" showCurrency />
              <MetricCard label={t('detail.declared')} value={record.dividend_declared} icon={FaChartLine} accent="emerald" showCurrency/>
              <MetricCard label={t('detail.broughtForward')} value={record.dividend_bf} icon={FaHistory} accent="violet" showCurrency />
            </div>

            {/* ── Shareholder Profile ── */}
            <ProfileCard record={record} />
          </div>
        )}
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          header, footer, button, select, [role="listbox"] { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </AppShell>
  );
}

/* ═══════════════════════ Reusable Components ═══════════════════════ */

/* ── Fiscal Year Dropdown ── */
function FiscalYearDropdown({ years, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const ref = useRef(null);
  const disabled = years.length === 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // Close on Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((o) => !o);
    }
  };

  const handleSelect = (year) => {
    onSelect(year);
    setOpen(false);
  };

  const displayLabel = selected ? `FY ${selected}` : (disabled ? t('detail.noYears') : t('detail.selectYear'));

  return (
    <div ref={ref} className="relative flex-1 sm:flex-none sm:w-52">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          w-full flex items-center gap-2.5 pl-3 pr-2 py-2
          bg-white border rounded-lg text-sm font-medium shadow-sm dark:bg-slate-800 dark:text-gray-200
          transition-all duration-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600'
          }
        `}
      >
        <FaCalendarAlt className="text-gray-400 dark:text-gray-500 text-xs shrink-0" />
        <span className="flex-1 text-left text-gray-700 dark:text-gray-200 truncate">{displayLabel}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop — dims the rest of the page on mobile */}
          <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} />

          <ul
            role="listbox"
            className="
              absolute z-50 top-full left-0 right-auto
              mt-1.5 w-full min-w-[12rem]
              max-h-64 overflow-y-auto
              theme-surface border rounded-lg
              shadow-lg ring-1 ring-black/5
              py-1
              animate-[slideUp_0.15s_ease]
            "
          >
            {years.map((year) => {
              const isActive = year === selected;
              return (
                <li
                  key={year}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(year)}
                  className={`
                    flex items-center justify-between
                    px-3 py-2.5 sm:py-2
                    text-sm cursor-pointer transition-colors duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/40 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700 dark:active:bg-slate-600'
                    }
                  `}
                >
                  <span>FY {year}</span>
                  {isActive && <FaCheck className="w-3.5 h-3.5 text-blue-600" />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/* ── Hero Total Card ── */
function HeroTotalCard({ value }) {
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#233e90] via-blue-700 to-indigo-800 px-4 py-5 sm:p-8 text-white shadow-xl">
      {/* decorative rings */}
      <div className="absolute -right-12 -top-12 w-48 h-48 sm:w-64 sm:h-64 rounded-full border-[32px] sm:border-[40px] border-white/5" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[20px] sm:border-[24px] border-white/5" />

      <div className="relative z-10">
        <p className="text-[11px] sm:text-sm font-semibold uppercase tracking-widest text-blue-200">
          {t('detail.total')}
        </p>
        <p className="mt-2 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight tabular-nums">
          {fmt(value)}<span className="text-2xl p-0 sm:text-xl lg:text-2xl font-extrabold"> ETB</span>
        </p>
        <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs sm:text-sm text-blue-200">
          <FaMoneyBillWave className="shrink-0" />
          <span>{t('detail.declaredForward')}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Metric Card ── */
const accentMap = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-600 dark:text-blue-300',    ring: 'ring-blue-100 dark:ring-blue-900',    bar: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-300', ring: 'ring-emerald-100 dark:ring-emerald-900', bar: 'bg-emerald-500' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/40',  text: 'text-violet-600 dark:text-violet-300',  ring: 'ring-violet-100 dark:ring-violet-900',  bar: 'bg-violet-500' },
};

function MetricCard({ label, value, icon: Icon, accent = 'blue', showCurrency = false }) {
  const c = accentMap[accent] || accentMap.blue;

  return (
    <div className="group relative theme-surface rounded-xl border border-gray-200/70 dark:border-gray-700/50 px-4 py-3.5 sm:p-5 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`p-2 rounded-lg ${c.bg} ${c.text} ring-1 ${c.ring}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-tight">
          {label}
        </p>
      </div>

      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">
        {fmt(value)}
        {showCurrency && (
          <span className="ml-1 text-[10px] font-medium text-gray-400 uppercase">
            ETB
          </span>
        )}
      </p>
    </div>
  );
}

/* ── Profile Info Card ── */
function ProfileCard({ record }) {
  const fields = [
    { icon: FaHashtag,      label: 'Registration No', value: record.reg_no },
    { icon: FaBuilding,     label: 'SIF No',          value: record.sif_no },
    { icon: FaUser,         label: 'Full Name',       value: record.sh_name },
    { icon: FaPhone,        label: 'Phone Number',    value: record.phone },
    { icon: FaIdCard,       label: 'National ID',     value: record.national_id },
    { icon: FaCalendarAlt,  label: 'Fiscal Year',     value: record.fiscal_year },
  ];

  return (
    <div className="theme-surface rounded-xl shadow-sm border overflow-hidden">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600 dark:bg-slate-700 dark:text-gray-300">
          <FaUser className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">Shareholder Profile</h3>
      </div>
      <div className="px-4 py-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4 sm:gap-x-8 sm:gap-y-5">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2 min-w-0">
            <div className="p-1.5 bg-gray-50 rounded-md text-gray-400 shrink-0 dark:bg-slate-700 dark:text-gray-300">
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate">{label}</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5 break-words truncate">{value || '-'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton Loader ── */
function SkeletonLayout() {
  return (
    <div className="space-y-3 sm:space-y-4 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 dark:from-slate-700 dark:to-slate-800 h-28 sm:h-36" />
      {/* Metric skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="theme-surface rounded-xl border px-4 py-3.5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-700" />
            </div>
            <div className="h-6 w-28 rounded bg-gray-100 dark:bg-slate-700" />
          </div>
        ))}
      </div>
      {/* Profile skeleton */}
      <div className="rounded-xl bg-white border border-gray-100 px-4 py-4 space-y-3 dark:bg-slate-800 dark:border-slate-700">
        <div className="h-4 w-36 rounded bg-gray-100 dark:bg-slate-700" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-16 rounded bg-gray-100 dark:bg-slate-700" />
              <div className="h-3.5 w-24 rounded bg-gray-100 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="theme-surface flex flex-col items-center justify-center py-16 sm:py-20 rounded-xl border shadow-sm">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 dark:bg-slate-700">
        <FaHistory className="text-2xl text-gray-300 dark:text-slate-500" />
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">No Records Found</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs text-center px-4">
        There are no dividend records for your account in the selected fiscal year.
      </p>
    </div>
  );
}