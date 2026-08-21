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

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DECISION_LABELS = {
  reinvest: 'Reinvest Full Dividend',
  fiscalreinvest: 'Reinvest Fiscal Year Dividend',
  withdraw: 'Withdraw Dividend',
};

const STATUS_CONFIG = {
  pending: { icon: FaClock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' },
  processed: { icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Processed' },
  rejected: { icon: FaTimesCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Rejected' },
};

export default function MyDecisionsPage() {
  const router = useRouter();
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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl flex items-center gap-3">
            <FaClipboardList className="text-sky-600" />
            My Submissions
          </h1>
          <p className="mt-2 text-slate-500">
            Review all the dividend decisions you have submitted.
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-100 bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && decisions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-sky-100 bg-white py-20 shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
              <FaFileInvoiceDollar className="text-3xl text-sky-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Submissions Yet</h3>
            <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
              You haven't submitted any dividend decisions yet. Head to the Fill Form page to get started.
            </p>
            <button
              onClick={() => router.push('/fillform')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-600 hover:to-blue-700"
            >
              <FaFileInvoiceDollar /> Fill Decision Form
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
                  className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Card Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(d.id)}
                    className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-sky-50/30"
                  >
                    {/* Icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
                      <FaFileInvoiceDollar className="text-sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">
                          {DECISION_LABELS[d.decision_type] || d.decision_type}
                        </p>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                          <StatusIcon className="text-[10px]" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
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
                    <div className="border-t border-sky-100 bg-gradient-to-b from-sky-50/30 to-white p-5">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem label="File Number" value={d.file_number || '—'} />
                        <DetailItem label="Shareholder" value={d.shareholder_name || '—'} />
                        <DetailItem label="Phone" value={d.phone || '—'} />
                        <DetailItem label="Email" value={d.email || '—'} />
                        <DetailItem label="Decision Type" value={DECISION_LABELS[d.decision_type] || d.decision_type} />
                        <DetailItem label="Fiscal Year" value={d.fiscal_year} />

                        {d.amount_to_convert && (
                          <DetailItem label="Amount to Convert" value={`${fmt(d.amount_to_convert)} ETB`} />
                        )}
                        {d.amount_to_withdraw && (
                          <DetailItem label="Amount to Withdraw" value={`${fmt(d.amount_to_withdraw)} ETB`} />
                        )}

                        {d.payment_method && (
                          <DetailItem label="Payment Method" value={d.payment_method === 'bank-transfer' ? 'Bank Transfer' : 'Check'} />
                        )}
                        {d.bank_name && (
                          <DetailItem label="Bank" value={d.bank_name} />
                        )}
                        {d.branch_name && (
                          <DetailItem label="Branch" value={d.branch_name} />
                        )}
                        {d.account_number && (
                          <DetailItem label="Account Number" value={d.account_number} />
                        )}

                        <DetailItem label="Status" value={statusCfg.label} />
                        <DetailItem label="Submitted" value={new Date(d.submission_date || d.created_at).toLocaleString()} />
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
      <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
