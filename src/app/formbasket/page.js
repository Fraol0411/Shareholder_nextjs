'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaFileInvoiceDollar, FaFilter, FaSearch, FaCalendarAlt,
  FaClock, FaCheckCircle, FaTimesCircle, FaUser, FaUserTie,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';

const STATUS_CONFIG = {
  pending:   { icon: FaClock,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending' },
  processed: { icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Processed' },
  rejected:  { icon: FaTimesCircle, color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Rejected' },
};

const DECISION_LABELS = {
  reinvest:       'Reinvest Full',
  fiscalreinvest: 'Reinvest FY',
  withdraw:       'Withdraw',
};
import { useTranslation } from '../../components/LanguageProvider';

export default function FormBasket() {
  const router = useRouter();
  const { t } = useTranslation();
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Dynamic fiscal years ──
  const [fiscalYears, setFiscalYears] = useState([]);

  // ── Filters ──
  const [fiscalYear, setFiscalYear] = useState('');
  const [decisionType, setDecisionType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Load fiscal years ──
  useEffect(() => {
    fetch('/api/fiscal-years')
      .then((r) => r.json())
      .then((data) => setFiscalYears(data || []))
      .catch(() => {});
  }, []);

  // ── Fetch forms when fiscal year changes ──
  useEffect(() => {
    if (!fiscalYear) {
      setForms([]);
      setFilteredForms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const fetchForms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch('/api/dividend/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load forms');

        const data = await res.json();
        const byYear = data.filter((f) => f.fiscal_year === fiscalYear);
        setForms(byYear);
        setFilteredForms(byYear);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [fiscalYear, router]);

  // ── Client-side filters ──
  useEffect(() => {
    if (!fiscalYear) { setFilteredForms([]); return; }

    let result = [...forms];
    if (decisionType)   result = result.filter((f) => f.decision_type === decisionType);
    if (paymentMethod)  result = result.filter((f) => f.payment_method === paymentMethod);
    if (statusFilter)   result = result.filter((f) => f.status === statusFilter);
    if (amountFrom)     result = result.filter((f) => Number(f.amount_to_withdraw) >= parseFloat(amountFrom));
    if (amountTo)       result = result.filter((f) => Number(f.amount_to_withdraw) <= parseFloat(amountTo));
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          (f.file_number && f.file_number.toLowerCase().includes(term)) ||
          (f.shareholder_name && f.shareholder_name.toLowerCase().includes(term))
      );
    }
    setFilteredForms(result);
  }, [fiscalYear, forms, decisionType, paymentMethod, statusFilter, amountFrom, amountTo, searchTerm]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl flex items-center gap-3">
            <FaFileInvoiceDollar className="text-sky-600" />
            Form Basket — All Decisions
          </h1>
          <p className="mt-2 text-slate-500">
            Browse and filter all dividend decisions submitted by shareholders or staff.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="mb-6 rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FaFilter className="text-sky-500" /> Filters
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Fiscal Year */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Fiscal Year *</label>
              <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10">
                <option value="">Select Year</option>
                {fiscalYears.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
              </select>
            </div>

            {/* Decision Type */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Decision Type</label>
              <select value={decisionType} onChange={(e) => setDecisionType(e.target.value)} disabled={!fiscalYear}
                className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-50 disabled:opacity-60">
                <option value="">All Types</option>
                <option value="reinvest">Reinvest Full</option>
                <option value="fiscalreinvest">Reinvest FY</option>
                <option value="withdraw">Withdraw</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={!fiscalYear}
                className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-50 disabled:opacity-60">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} disabled={!fiscalYear}
                className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-50 disabled:opacity-60">
                <option value="">All Methods</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="check">Check</option>
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Min Withdraw (ETB)</label>
              <input type="number" value={amountFrom} onChange={(e) => setAmountFrom(e.target.value)} placeholder="e.g. 5000" disabled={!fiscalYear}
                className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-50 disabled:opacity-60" />
            </div>

            {/* Max Amount */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Max Withdraw (ETB)</label>
              <input type="number" value={amountTo} onChange={(e) => setAmountTo(e.target.value)} placeholder="e.g. 10000" disabled={!fiscalYear}
                className="w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-50 disabled:opacity-60" />
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="File # or shareholder name" disabled={!fiscalYear}
                  className="w-full rounded-lg border border-sky-100 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 disabled:bg-slate-50 disabled:opacity-60" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && fiscalYear && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          </div>
        )}

        {/* ── No Fiscal Year ── */}
        {!fiscalYear && !loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-sky-100 bg-white py-20 shadow-sm">
            <FaCalendarAlt className="mb-4 text-5xl text-slate-200" />
            <h3 className="text-lg font-bold text-slate-800">Select a Fiscal Year</h3>
            <p className="mt-1 text-sm text-slate-500">Choose a fiscal year above to load dividend decisions.</p>
          </div>
        )}

        {/* ── Results ── */}
        {fiscalYear && !loading && !error && (
          <>
            <div className="mb-4 text-sm text-slate-600">
              Showing <strong className="text-slate-800">{filteredForms.length}</strong> of <strong className="text-slate-800">{forms.length}</strong> decision(s) for FY {fiscalYear}
            </div>

            {filteredForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-sky-100 bg-white py-16 shadow-sm">
                <FaFileInvoiceDollar className="mb-3 text-4xl text-slate-200" />
                <p className="text-sm text-slate-500">No decisions match your filters.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                      <tr>
                        {['Shareholder', 'Fiscal Year', 'Decision', 'Withdraw (ETB)', 'Status', 'Submitted By', 'Date'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50">
                      {filteredForms.map((form) => {
                        const statusCfg = STATUS_CONFIG[form.status] || STATUS_CONFIG.pending;
                        const StatusIcon = statusCfg.icon;
                        const submittedByStaff = form.entered_by && !form.user_id;
                        const submittedByUser = form.user_id && !form.entered_by;

                        return (
                          <tr
                            key={form.id}
                            className="cursor-pointer transition-colors hover:bg-sky-50/40"
                            onClick={() => router.push(`/formbasket/${form.id}`)}
                          >
                            <td className="px-5 py-4 font-medium text-slate-800">{form.shareholder_name}</td>
                            <td className="px-5 py-4 text-slate-600">{form.fiscal_year}</td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                form.decision_type === 'withdraw' ? 'bg-red-50 text-red-700 border border-red-100' :
                                form.decision_type === 'fiscalreinvest' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {DECISION_LABELS[form.decision_type] || form.decision_type}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {form.amount_to_withdraw ? Number(form.amount_to_withdraw).toLocaleString() : '—'}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                                <StatusIcon className="text-[10px]" />
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                                {submittedByUser ? (
                                  <><FaUser className="text-sky-400" /> Self</>
                                ) : (
                                  <><FaUserTie className="text-blue-500" /> {form.entered_by_name || 'Staff'}</>
                                )}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">
                              {new Date(form.submission_date || form.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Error ── */}
        {error && fiscalYear && !loading && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
            <strong>Error:</strong> {error}
            <button onClick={() => window.location.reload()} className="ml-2 text-sm underline">Retry</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
