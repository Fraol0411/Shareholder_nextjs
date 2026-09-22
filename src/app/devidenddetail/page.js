'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCalendarAlt, FaWallet, FaChartLine, FaHistory, FaMoneyBillWave,
  FaUser, FaIdCard, FaPhone, FaExclamationTriangle, FaBuilding,
  FaHashtag, FaPrint, FaCheck, FaUniversity, FaFileInvoiceDollar
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { useTranslation } from '../../components/LanguageProvider';
import { getToken } from '../../libs/auth';

/* ─── Format number helper ─── */
const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const DECISION_LABELS = {
  reinvest: 'decisions.reinvest',
  fiscalreinvest: 'decisions.fiscalReinvest',
  withdraw: 'decisions.withdraw',
};

export default function DividendDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const [regNo, setRegNo] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [myDecisions, setMyDecisions] = useState([]);

  useEffect(() => {
    const storedRegNo = localStorage.getItem('reg_no');
    if (storedRegNo) {
      setRegNo(storedRegNo);
      fetchDetails(storedRegNo, '');
    } else {
      setIsLoading(false);
      setError('User registration number not found. Please log in again.');
    }

    const token = getToken();
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/decisions/my-decisions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMyDecisions(data.decisions || []))
      .catch(() => setMyDecisions([]));
  }, []);

  const fetchDetails = async (currentRegNo, year) => {
    setIsLoading(true);
    setError('');
    try {
      const url = year
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/dividend-detail?reg_no=${encodeURIComponent(currentRegNo)}&fiscal_year=${encodeURIComponent(year)}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/dividend-detail?reg_no=${encodeURIComponent(currentRegNo)}`;

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

  const yearDecision = myDecisions.find(
    (item) => String(item.fiscal_year) === String(selectedYear)
  );

  return (
    <AppShell>
      <div className="py-4 sm:py-6">
        {/* ── Header ── */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {t('detail.title')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {t('detail.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <FiscalYearDropdown
              years={fiscalYears}
              selected={selectedYear}
              onSelect={handleYearSelect}
            />

            {record && (
              <button
                onClick={handlePrint}
                title={t('detail.print')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-secondary/40 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:text-sm"
              >
                <FaPrint className="text-xs" />
                <span className="hidden sm:inline">{t('detail.print')}</span>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <SkeletonLayout />
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 sm:p-5">
            <div className="shrink-0 rounded-lg bg-red-100 p-1.5 dark:bg-red-900/60">
              <FaExclamationTriangle className="text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">Something went wrong</p>
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        ) : !record ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <DividendSummaryCard record={record} t={t} />

            <DecisionImpactCard
              decision={yearDecision}
              totalDividend={record.total_dividend}
              t={t}
              onFillDecision={() => router.push('/fillform')}
            />

            <ProfileCard record={record} />
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          header, footer, button, select, [role="listbox"] { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </AppShell>
  );
}

function DecisionImpactCard({ decision, totalDividend, t, onFillDecision }) {
  if (!decision) {
    return (
      <div className="overflow-hidden rounded-xl border border-brand-primary/15 bg-gradient-to-br from-brand-primary to-brand-primary-hover p-4 text-white shadow-lg shadow-brand-primary/20 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-secondary">
            <FaFileInvoiceDollar className="text-sm" />
            {t('detail.decisionTitle')}
          </div>
          <h3 className="text-base font-bold sm:text-lg">{t('detail.noDecision')}</h3>
          <p className="mt-0.5 text-xs text-white/70 sm:text-sm">{t('detail.noDecisionCta')}</p>
        </div>
        <button
          type="button"
          onClick={onFillDecision}
          className="mt-3 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-secondary px-5 text-sm font-bold text-white shadow-md shadow-brand-secondary/30 transition hover:bg-brand-secondary-hover active:scale-[0.98] sm:mt-0 sm:w-auto"
        >
          <FaFileInvoiceDollar className="text-sm" />
          {t('detail.fillDecision')}
        </button>
      </div>
    );
  }

  const total = toNumber(totalDividend);
  const convert = toNumber(decision.amount_to_convert);
  const withdraw = toNumber(decision.amount_to_withdraw);
  const type = decision.decision_type;

  const toCapital =
    type === 'reinvest' || type === 'fiscalreinvest'
      ? (convert > 0 ? convert : total)
      : convert;
  const toCash = type === 'withdraw' ? withdraw : 0;
  const unallocated = Math.max(total - toCapital - toCash, 0);

  const capitalPct = total > 0 ? Math.min((toCapital / total) * 100, 100) : 0;
  const cashPct = total > 0 ? Math.min((toCash / total) * 100, 100) : 0;
  const restPct = Math.max(100 - capitalPct - cashPct, 0);

  const note =
    type === 'reinvest'
      ? t('detail.fullReinvestNote')
      : type === 'fiscalreinvest'
        ? t('detail.fiscalReinvestNote')
        : t('detail.withdrawNote');

  const submittedDate = decision.submission_date || decision.created_at;
  const statusLabel =
    decision.status === 'processed'
      ? t('decisions.processed')
      : decision.status === 'rejected'
        ? t('decisions.rejected')
        : t('decisions.pending');

  return (
    <div className="overflow-hidden rounded-xl border border-brand-secondary/20 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.05] to-brand-secondary/[0.08] px-4 py-3.5 dark:border-slate-700 dark:from-brand-primary/15 dark:to-brand-secondary/10 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
              <FaFileInvoiceDollar className="text-sm" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                {t('detail.decisionTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                {t('detail.decisionSubtitle')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-secondary/15 px-2.5 py-1 text-[11px] font-semibold text-brand-primary dark:text-brand-secondary">
            {t(DECISION_LABELS[type] || 'decisions.withdraw')}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{note}</p>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>{t('detail.decisionImpact')}</span>
            <span className="normal-case tracking-normal text-slate-600 dark:text-slate-300">
              {t('detail.totalBalance')}: {fmt(total)} ETB
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            {capitalPct > 0 && (
              <div className="bg-brand-primary transition-all" style={{ width: `${capitalPct}%` }} title={t('detail.allocatedToCapital')} />
            )}
            {cashPct > 0 && (
              <div className="bg-brand-secondary transition-all" style={{ width: `${cashPct}%` }} title={t('detail.allocatedToCash')} />
            )}
            {restPct > 0.5 && (
              <div className="bg-slate-300 transition-all dark:bg-slate-600" style={{ width: `${restPct}%` }} title={t('detail.unallocated')} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <ImpactStat
            label={t('detail.allocatedToCapital')}
            value={toCapital}
            color="text-brand-primary dark:text-blue-300"
            dot="bg-brand-primary"
          />
          <ImpactStat
            label={t('detail.allocatedToCash')}
            value={toCash}
            color="text-brand-secondary dark:text-cyan-300"
            dot="bg-brand-secondary"
          />
          <ImpactStat
            label={t('detail.unallocated')}
            value={unallocated}
            color="text-slate-600 dark:text-slate-300"
            dot="bg-slate-400"
          />
        </div>

        {type === 'withdraw' && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('decisions.paymentMethod')}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {decision.payment_method === 'bank-transfer'
                  ? t('decisions.bankTransfer')
                  : decision.payment_method === 'check'
                    ? t('decisions.check')
                    : '—'}
              </p>
            </div>
            {decision.payment_method === 'bank-transfer' && (
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <FaUniversity className="text-brand-secondary" />
                  <span className="font-semibold">{decision.bank_name || '—'}</span>
                </p>
                {decision.branch_name && (
                  <p className="text-xs text-slate-500">{decision.branch_name}</p>
                )}
                {decision.account_number && (
                  <p className="text-xs text-slate-500">
                    {t('decisions.accountNumber')}: {decision.account_number}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {submittedDate && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('detail.submittedOn')}:{' '}
            {new Date(submittedDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function ImpactStat({ label, value, color, dot }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mb-1 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
      <p className={`text-base font-bold tabular-nums sm:text-lg ${color}`}>
        {fmt(value)} <span className="text-[10px] font-medium text-slate-400">ETB</span>
      </p>
    </div>
  );
}

function DividendSummaryCard({ record, t }) {
  return (
    <section className="overflow-hidden rounded-xl border border-brand-secondary/20 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.06] via-white to-brand-secondary/[0.08] px-3.5 py-3 dark:border-slate-700 dark:from-brand-primary/20 dark:via-slate-800 dark:to-brand-secondary/10 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white shadow-sm shadow-brand-primary/30 sm:h-9 sm:w-9 sm:rounded-xl">
            <FaMoneyBillWave className="text-sm" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {t('detail.summaryTitle')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('detail.fiscalYearBadge').replace('{year}', record.fiscal_year)}
              {' · '}
              {t('detail.declaredForward')}
            </p>
          </div>
        </div>
        <div className="rounded-full bg-brand-secondary/15 px-3 py-1 text-xs font-semibold text-brand-primary dark:text-brand-secondary">
          {t('detail.total')}: {fmt(record.total_dividend)} ETB
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-700 sm:grid-cols-4">
        <SummaryMetric
          icon={FaMoneyBillWave}
          label={t('detail.total')}
          value={fmt(record.total_dividend)}
          highlight
        />
        <SummaryMetric
          icon={FaWallet}
          label={t('detail.paidCapital')}
          value={fmt(record.paidup_capital)}
        />
        <SummaryMetric
          icon={FaChartLine}
          label={t('detail.declared')}
          value={fmt(record.dividend_declared)}
        />
        <SummaryMetric
          icon={FaHistory}
          label={t('detail.broughtForward')}
          value={fmt(record.dividend_bf)}
        />
      </div>
    </section>
  );
}

function SummaryMetric({ icon: Icon, label, value, highlight = false }) {
  return (
    <div
      className={`bg-white p-3 sm:p-3.5 dark:bg-slate-800 ${
        highlight
          ? 'bg-gradient-to-br from-brand-secondary-soft to-white dark:from-brand-secondary/10 dark:to-slate-800'
          : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Icon className={`h-3 w-3 shrink-0 ${highlight ? 'text-brand-secondary' : 'text-brand-primary/70'}`} />
        <span className="truncate">{label}</span>
      </div>
      <p
        className={`mt-1 text-sm font-bold tabular-nums sm:text-base ${
          highlight ? 'text-brand-primary dark:text-brand-secondary' : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
        <span className="ml-1 text-[10px] font-medium text-slate-400">ETB</span>
      </p>
    </div>
  );
}

function FiscalYearDropdown({ years, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const ref = useRef(null);
  const disabled = years.length === 0;

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

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute z-50 top-full left-0 right-auto mt-1.5 w-full min-w-[12rem] max-h-64 overflow-y-auto theme-surface border rounded-lg shadow-lg ring-1 ring-black/5 py-1 animate-[slideUp_0.15s_ease]"
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
                    flex items-center justify-between px-3 py-2.5 sm:py-2 text-sm cursor-pointer transition-colors duration-150
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

function ProfileCard({ record }) {
  const { t } = useTranslation();
  const fields = [
    { icon: FaHashtag, label: 'Registration No', value: record.reg_no },
    { icon: FaBuilding, label: 'SIF No', value: record.sif_no },
    { icon: FaUser, label: 'Full Name', value: record.sh_name },
    { icon: FaPhone, label: 'Phone Number', value: record.phone },
    { icon: FaIdCard, label: 'National ID', value: record.national_id },
    { icon: FaCalendarAlt, label: 'Fiscal Year', value: record.fiscal_year },
  ];

  return (
    <div className="theme-surface rounded-xl shadow-sm border overflow-hidden">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600 dark:bg-slate-700 dark:text-gray-300">
          <FaUser className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100">{t('profile.header')}</h3>
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

function SkeletonLayout() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="h-14 bg-slate-100 dark:bg-slate-700/60" />
        <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-700 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 bg-white p-3 dark:bg-slate-800">
              <div className="h-2.5 w-16 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 space-y-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="h-4 w-36 rounded bg-slate-100 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-16 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-3.5 w-24 rounded bg-slate-100 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
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
