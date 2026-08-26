'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaClipboardList,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaFileInvoiceDollar,
  FaUniversity,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { getToken, getStoredUser } from '../../libs/auth';
import { useTranslation } from '../../components/LanguageProvider';

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DECISION_LABELS = {
  reinvest: 'decisions.reinvest',
  fiscalreinvest: 'decisions.fiscalReinvest',
  withdraw: 'decisions.withdraw',
};

const STATUS_CONFIG = {
  pending: { icon: FaClock, color: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', label: 'decisions.pending' },
  processed: { icon: FaCheckCircle, color: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', label: 'decisions.processed' },
  rejected: { icon: FaTimesCircle, color: 'text-red-600 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200 dark:border-red-800', label: 'decisions.rejected' },
};

export default function MyDecisionsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [decisions, setDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    fetchDecisions(token);
  }, [router]);

  const fetchDecisions = async (token) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/decisions/my-decisions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // check if response has rows
      if (!data || !data.decisions || data.decisions.length === 0) {
        setDecisions([]);
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data.message || 'Failed to load decisions');
      setDecisions(data.decisions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <AppShell>
      <div className="py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl flex items-center gap-3">
            <FaClipboardList className="text-sky-600" />
            {t('decisions.title')}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {t('decisions.subtitle')}
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-100 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-700" />
                    <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-700" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && decisions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-sky-100 bg-white py-20 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 dark:bg-slate-700">
              <FaFileInvoiceDollar className="text-3xl text-sky-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('decisions.emptyTitle')}</h3>
            <p className="mt-1 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
              {t('decisions.emptyDescription')}
            </p>
            <button
              onClick={() => router.push('/fillform')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-600 hover:to-blue-700"
            >
              <FaFileInvoiceDollar /> {t('decisions.fillForm')}
            </button>
          </div>
        )}

        {/* ── Decisions List ── */}
        {!isLoading && decisions.length > 0 && (
          <div className="space-y-4">
            {decisions.map((d) => {
              const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedId === d.id;

              return (
                <div
                  key={d.id}
                  className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                >
                  {/* Card Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(d.id)}
                    className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-sky-50/30 dark:hover:bg-slate-700/60"
                  >
                    {/* Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
                      <FaFileInvoiceDollar className="text-sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          {t(DECISION_LABELS[d.decision_type]) || d.decision_type}
                        </p>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                          <StatusIcon className="text-[10px]" />
                          {t(statusCfg.label)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-sky-400" /> FY {d.fiscal_year}
                        </span>
                        <span>Submitted: {new Date(d.submission_date || d.created_at).toLocaleDateString()}</span>
                        {d.shareholder_name && (
                          <span className="truncate">{d.shareholder_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Expand Arrow */}
                    <div className="shrink-0 text-slate-400">
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-sky-100 bg-gradient-to-b from-sky-50/30 to-white p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem label={t('decisions.fileNumber')} value={d.file_number || '-'} />
                        <DetailItem label={t('decisions.shareholder')} value={d.shareholder_name || '-'} />
                        <DetailItem label={t('decisions.phone')} value={d.phone || '-'} />
                        <DetailItem label={t('decisions.email')} value={d.email || '-'} />
                        <DetailItem label={t('decisions.decisionType')} value={t(DECISION_LABELS[d.decision_type]) || d.decision_type} />
                        <DetailItem label={t('decisions.fiscalYear')} value={d.fiscal_year} />

                        {d.amount_to_convert && (
                          <DetailItem label={t('decisions.amountToConvert')} value={`${fmt(d.amount_to_convert)} ETB`} />
                        )}
                        {d.amount_to_withdraw && (
                          <DetailItem label={t('decisions.amountToWithdraw')} value={`${fmt(d.amount_to_withdraw)} ETB`} />
                        )}

                        {d.payment_method && (
                          <DetailItem label={t('decisions.paymentMethod')} value={d.payment_method === 'bank-transfer' ? t('decisions.bankTransfer') : t('decisions.check')} />
                        )}
                        {d.bank_name && (
                          <DetailItem label={t('decisions.bank')} value={d.bank_name} />
                        )}
                        {d.branch_name && (
                          <DetailItem label={t('decisions.branch')} value={d.branch_name} />
                        )}
                        {d.account_number && (
                          <DetailItem label={t('decisions.accountNumber')} value={d.account_number} />
                        )}

                        <DetailItem label={t('decisions.status')} value={t(statusCfg.label)} />
                        <DetailItem label={t('decisions.submitted')} value={new Date(d.submission_date || d.created_at).toLocaleString()} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ── Detail Item ── */
function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
