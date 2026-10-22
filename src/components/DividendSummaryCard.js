'use client';

import {
  FaCalendarAlt, FaChartLine, FaHistory, FaMoneyBillWave, FaWallet,
} from 'react-icons/fa';

/**
 * The shareholder's dividend summary card — the balance hero plus the three
 * figures behind it.
 *
 * It lives here because two pages show the same money: the statement
 * (/devidenddetail) and the decision form (/fillform). One component means the
 * balance reads identically wherever a shareholder meets it, and the form's
 * decision is made about the number the statement printed.
 */

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* A balance figure is meaningless without the date it is struck on. Ethiopian share
   companies (Awash Insurance included) close their accounts on the last day of a
   July–June fiscal year, so the balance held under FY 2024/25 is the position as at
   30 June 2025 — the same "as at" date their audited statements carry. */
const FISCAL_YEAR_CLOSE_MONTH = 5; // June, zero-based

// The statement date is written in English in every language: it names the accounts the
// figure comes from, and the translated forms read poorly.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Returns the closing date of a "2024/25" style label, or null when the label is not a
// clean year range — a guessed date on a financial figure is worse than no date.
const FY_RANGE = /^(?:FY\s*)?(\d{4})\s*[/\-–]\s*(\d{2}|\d{4})$/i;

export const fiscalYearCloseDate = (label) => {
  const match = FY_RANGE.exec(String(label || '').trim());
  if (!match) return null;
  const start = Number(match[1]);
  const tail = match[2];
  const end =
    tail.length === 2 ? start + ((Number(tail) - (start % 100) + 100) % 100) : Number(tail);
  if (!Number.isFinite(end) || end < start || end - start > 1) return null;
  return new Date(end, FISCAL_YEAR_CLOSE_MONTH, 30);
};

// "June 2025", or "June 30, 2025" when the day is asked for.
export const formatDateLabel = (date, withDay = false) =>
  withDay
    ? `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    : `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

export function DividendSummaryCard({ record, t }) {
  const yearLabel = t('detail.fiscalYearBadge').replace('{year}', record.fiscal_year);
  const closeDate = fiscalYearCloseDate(record.fiscal_year);
  const asOfMonthYear = closeDate ? formatDateLabel(closeDate) : null;
  const asOfFullDate = closeDate ? formatDateLabel(closeDate, true) : null;

  return (
    <section className="overflow-hidden rounded-xl border border-brand-secondary/20 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-3.5 py-3 dark:border-slate-700 sm:px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary text-white shadow-sm shadow-brand-primary/30 sm:h-9 sm:w-9 sm:rounded-xl">
          <FaMoneyBillWave className="text-sm" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {t('detail.summaryTitle')}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{yearLabel}</p>
        </div>
      </div>

      {/* The one number the shareholder opens this page for — everything else supports it */}
      <div className="balance-hero relative overflow-hidden bg-gradient-to-br from-brand-primary via-brand-primary-hover to-brand-primary px-4 py-6 text-white shadow-inner shadow-brand-primary/20 ring-1 ring-inset ring-white/10 sm:px-6 sm:py-8">
        <FaMoneyBillWave
          className="pointer-events-none absolute -bottom-8 -right-3 h-36 w-36 text-white/[0.07]"
          aria-hidden="true"
        />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-xs">
          {t('detail.total')}
        </p>
        <p className="relative mt-2 flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[2rem] font-black leading-[1.05] tracking-tight tabular-nums drop-shadow-sm sm:text-5xl">
            {fmt(record.total_dividend)}
          </span>
          <span className="text-sm font-bold text-white/70 sm:text-base">ETB</span>
        </p>
        <div className="relative mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {asOfMonthYear && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-white/25 sm:text-xs"
              title={
                asOfFullDate ? t('detail.asOf').replace('{date}', asOfFullDate) : undefined
              }
            >
              <FaCalendarAlt className="h-3 w-3 shrink-0 opacity-80" aria-hidden="true" />
              {t('detail.asOf').replace('{date}', asOfMonthYear)}
            </span>
          )}
          <span className="text-[11px] text-white/70 sm:text-xs">{t('detail.declaredForward')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-slate-100 dark:bg-slate-700 sm:grid-cols-3">
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

function SummaryMetric({ icon: Icon, label, value }) {
  return (
    <div className="bg-white p-3 sm:p-3.5 dark:bg-slate-800">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Icon className="h-3 w-3 shrink-0 text-brand-primary/70" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base dark:text-white">
        {value}
        <span className="ml-1 text-[10px] font-medium text-slate-400">ETB</span>
      </p>
    </div>
  );
}
