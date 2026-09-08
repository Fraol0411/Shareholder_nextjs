'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import AppShell from '../../components/AppShell';
import { getStoredUser, getToken, isAdminRole } from '../../libs/auth';
import { useTranslation } from '../../components/LanguageProvider';

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const DECISION_LABELS = {
  reinvest: 'decisions.reinvest',
  fiscalreinvest: 'decisions.fiscalReinvest',
  withdraw: 'decisions.withdraw',
};

const STATUS_STYLES = {
  pending: {
    icon: HiOutlineClock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    label: 'approvals.pending',
  },
  approved: {
    icon: HiOutlineCheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    label: 'approvals.approved',
  },
  rejected: {
    icon: HiOutlineXCircle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    label: 'approvals.rejected',
  },
};

function ApprovalsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [authorized, setAuthorized] = useState(false);
  const initialStatus = STATUS_TABS.includes(searchParams.get('status'))
    ? searchParams.get('status')
    : 'pending';
  const [statusTab, setStatusTab] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [decisionType, setDecisionType] = useState('');
  const [decisions, setDecisions] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [fiscalYears, setFiscalYears] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdminRole(user?.role)) {
      router.replace(user ? '/home' : '/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    const fromUrl = searchParams.get('status');
    if (STATUS_TABS.includes(fromUrl) && fromUrl !== statusTab) {
      setStatusTab(fromUrl);
    }
  }, [searchParams, statusTab]);

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${getToken()}`,
    }),
    []
  );

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusTab) params.set('status', statusTab);
      if (fiscalYear) params.set('fiscal_year', fiscalYear);
      if (decisionType) params.set('decision_type', decisionType);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/approvals?${params.toString()}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('approvals.loadFailed'));

      setDecisions(data.decisions || []);
      setCounts(data.counts || { all: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      toast.error(err.message);
      setDecisions([]);
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, statusTab, fiscalYear, decisionType, searchTerm, t]);

  useEffect(() => {
    if (!authorized) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fiscal-years`)
      .then((r) => r.json())
      .then((data) => setFiscalYears(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    const timer = setTimeout(() => {
      fetchApprovals();
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [authorized, fetchApprovals, searchTerm]);

  const yearsOptions = useMemo(() => {
    const fromApi = fiscalYears.map((y) => (typeof y === 'string' ? y : y.fiscal_year || y.year)).filter(Boolean);
    const fromRows = decisions.map((d) => d.fiscal_year).filter(Boolean);
    return [...new Set([...fromApi, ...fromRows])].sort().reverse();
  }, [fiscalYears, decisions]);

  const handleStatusTab = (tab) => {
    setStatusTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') params.delete('status');
    else params.set('status', tab);
    const qs = params.toString();
    router.replace(qs ? `/approvals?${qs}` : '/approvals');
  };

  if (!authorized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-secondary">
            <HiOutlineShieldCheck className="h-4 w-4" />
            {t('approvals.eyebrow')}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('approvals.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {t('approvals.subtitle')}
          </p>
        </div>
        {counts.pending > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            {counts.pending} {t('approvals.pending')}
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const active = statusTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleStatusTab(tab)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-brand-secondary bg-brand-secondary-soft text-brand-primary ring-2 ring-brand-secondary/20 dark:text-brand-secondary'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-secondary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t(`approvals.tab.${tab}`)}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active
                    ? 'bg-brand-primary text-white'
                    : tab === 'pending' && counts.pending > 0
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {counts[tab] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <HiOutlineFunnel className="h-3.5 w-3.5 text-brand-secondary" />
          {t('approvals.filters')}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('approvals.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('approvals.allYears')}</option>
            {yearsOptions.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
          <select
            value={decisionType}
            onChange={(e) => setDecisionType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('approvals.allDecisions')}</option>
            <option value="withdraw">{t('decisions.withdraw')}</option>
            <option value="reinvest">{t('decisions.reinvest')}</option>
            <option value="fiscalreinvest">{t('decisions.fiscalReinvest')}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
        </div>
      ) : decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <HiOutlineShieldCheck className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('approvals.emptyTitle')}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('approvals.emptyDesc')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {decisions.map((item) => {
            const status = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
            const StatusIcon = status.icon;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-secondary/40 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {t(status.label)}
                      </span>
                      <span className="rounded-full bg-brand-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-brand-primary dark:text-brand-secondary">
                        {t(DECISION_LABELS[item.decision_type] || 'decisions.withdraw')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                        FY {item.fiscal_year}
                      </span>
                    </div>
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                      {item.shareholder_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {item.file_number}
                      {item.reg_no ? ` · ${item.reg_no}` : ''}
                      {item.phone ? ` · ${item.phone}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                      {item.decision_type === 'withdraw' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-secondary">
                          <HiOutlineBanknotes className="h-3.5 w-3.5" />
                          {fmt(item.amount_to_withdraw)} ETB
                        </span>
                      )}
                      {(Number(item.amount_to_convert) > 0 ||
                        ['reinvest', 'fiscalreinvest'].includes(item.decision_type)) && (
                        <span className="font-medium">
                          {t('decisions.amountToConvert')}: {fmt(item.amount_to_convert)} ETB
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/approvals/${item.id}`}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-primary-hover"
                  >
                    <HiOutlineEye className="h-4 w-4" />
                    {item.status === 'pending' ? t('approvals.review') : t('approvals.view')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
          </div>
        }
      >
        <ApprovalsPageInner />
      </Suspense>
    </AppShell>
  );
}
