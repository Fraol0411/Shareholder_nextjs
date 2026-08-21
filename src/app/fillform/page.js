'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaChartLine,
  FaWallet,
  FaHistory,
  FaExclamationCircle,
  FaCheckCircle,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaUniversity,
  FaHashtag,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { getToken, getStoredUser } from '../../libs/auth';

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ShareholderFillForm() {
  const router = useRouter();

  // ── Auth state ──
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // ── Fiscal year & dividend data ──
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [dividendData, setDividendData] = useState(null);
  const [loadingDividend, setLoadingDividend] = useState(false);

  // ── Form state ──
  const [shareholderName, setShareholderName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [decision, setDecision] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountToConvert, setAmountToConvert] = useState('');
  const [amountToWithdraw, setAmountToWithdraw] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // ── Submission state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Load auth on mount ──
  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (!t || !u) {
      router.replace('/login');
      return;
    }
    setToken(t);
    setUser(u);
    setShareholderName(u.name || u.username || '');
    setPhone(u.phone || '');
  }, [router]);

  // ── Fetch available fiscal years ──
  useEffect(() => {
    if (!token) return;
    fetch('/api/shareholder-dividend', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setFiscalYears(data.fiscalYears || []))
      .catch(() => {});
  }, [token]);

  // ── Fetch dividend data when fiscal year selected ──
  useEffect(() => {
    if (!token || !selectedYear) return;
    setLoadingDividend(true);
    setDividendData(null);

    fetch(`/api/shareholder-dividend?fiscal_year=${encodeURIComponent(selectedYear)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setDividendData(data.dividend || null);
        // Pre-fill from dividend record if available
        if (data.dividend?.shareholder_name) {
          setShareholderName(data.dividend.shareholder_name);
        }
        if (data.dividend?.phone) {
          setPhone(data.dividend.phone);
        }
      })
      .catch(() => setDividendData(null))
      .finally(() => setLoadingDividend(false));
  }, [token, selectedYear]);

  // ── Submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision || !selectedYear) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/decisions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shareholder_name: shareholderName,
          email: email || null,
          phone: phone || null,
          fiscal_year: selectedYear,
          decision_type: decision,
          amount_to_convert: amountToConvert || null,
          amount_to_withdraw: amountToWithdraw || null,
          payment_method: paymentMethod || null,
          bank_name: bankName || null,
          branch_name: branchName || null,
          account_number: accountNumber || null,
          sh_dividend_id: dividendData?.sh_dividend_id || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Submission failed');

      setSuccess('Your decision has been submitted successfully!');
      // Reset form
      setDecision('');
      setPaymentMethod('');
      setAmountToConvert('');
      setAmountToWithdraw('');
      setBankName('');
      setBranchName('');
      setAccountNumber('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ──
  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Dividend Decision Form
          </h1>
          <p className="mt-2 text-slate-500">
            Select a fiscal year, review your dividend information, and submit your decision.
          </p>
        </div>

        {/* ── Success Banner ── */}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{success}</p>
              <p className="mt-1 text-sm text-emerald-600">
                You can view your submission on the{' '}
                <button onClick={() => router.push('/my-decisions')} className="font-semibold underline">
                  My Submissions
                </button>{' '}
                page.
              </p>
            </div>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Fiscal Year Selector ── */}
        <div className="mb-6 rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            <FaCalendarAlt className="mr-1.5 inline text-sky-500" />
            Select Fiscal Year
          </label>
          {fiscalYears.length === 0 ? (
            <p className="text-sm text-slate-400">No fiscal years available for your account.</p>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSuccess('');
                setError('');
              }}
              className="block w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
            >
              <option value="">-- Choose a fiscal year --</option>
              {fiscalYears.map((fy) => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
          )}
        </div>

        {/* ── Step 2: Dividend Info Card ── */}
        {selectedYear && loadingDividend && (
          <div className="mb-6 flex items-center justify-center rounded-xl border border-sky-100 bg-sky-50/40 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          </div>
        )}

        {selectedYear && !loadingDividend && !dividendData && (
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-6 text-amber-700">
            <FaExclamationCircle className="mr-2 inline" />
            No dividend record found for fiscal year {selectedYear}.
          </div>
        )}

        {dividendData && (
          <div className="mb-6 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                <FaChartLine className="text-sky-600" />
                Your Dividend Summary — FY {dividendData.fiscal_year}
              </h3>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <InfoBox icon={FaWallet} label="Paid-up Capital" value={fmt(dividendData.paidup_capital)} suffix="ETB" />
              <InfoBox icon={FaChartLine} label="Dividend Declared" value={fmt(dividendData.dividend_declared)} suffix="ETB" />
              <InfoBox icon={FaHistory} label="Dividend Brought Forward" value={fmt(dividendData.dividend_bf)} suffix="ETB" />
              <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600">
                  <FaMoneyBillWave /> Total Dividend
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {fmt(dividendData.total_dividend)} <span className="text-xs font-medium text-sky-500">ETB</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Decision Form ── */}
        {dividendData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <FaUser className="text-sky-500" /> Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" icon={FaUser} value={shareholderName} onChange={setShareholderName} required />
                <Field label="Phone" icon={FaPhone} value={phone} onChange={setPhone} type="tel" />
                <div className="sm:col-span-2">
                  <Field label="Email (optional)" icon={FaEnvelope} value={email} onChange={setEmail} type="email" />
                </div>
              </div>
            </div>

            {/* Decision Type */}
            <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <FaFileInvoiceDollar className="text-sky-500" /> Choose Your Decision
              </h3>
              <div className="space-y-3">
                {/* Reinvest */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    decision === 'reinvest' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'
                  }`}
                >
                  <input type="radio" name="decision" value="reinvest" checked={decision === 'reinvest'} onChange={() => setDecision('reinvest')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                  <div>
                    <span className="font-semibold text-slate-800">Reinvest full dividend in capital</span>
                    <p className="mt-0.5 text-sm text-slate-500">All undrawn dividend will be converted to capital.</p>
                  </div>
                </label>

                {/* Fiscal Reinvest */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    decision === 'fiscalreinvest' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'
                  }`}
                >
                  <input type="radio" name="decision" value="fiscalreinvest" checked={decision === 'fiscalreinvest'} onChange={() => setDecision('fiscalreinvest')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                  <div>
                    <span className="font-semibold text-slate-800">Reinvest this fiscal year dividend in capital</span>
                    <p className="mt-0.5 text-sm text-slate-500">Only this year's dividend will be converted to capital.</p>
                  </div>
                </label>

                {/* Withdraw */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                    decision === 'withdraw' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'
                  }`}
                >
                  <input type="radio" name="decision" value="withdraw" checked={decision === 'withdraw'} onChange={() => setDecision('withdraw')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                  <div>
                    <span className="font-semibold text-slate-800">Withdraw my dividend</span>
                    <p className="mt-0.5 text-sm text-slate-500">Receive your dividend as a cash payment.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Withdraw Details ── */}
            {decision === 'withdraw' && (
              <div className="space-y-4 rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <FaMoneyBillWave className="text-sky-500" /> Withdrawal Details
                </h3>

                {/* Amount to convert */}
                <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-4">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Portion to convert to capital (optional)
                  </label>
                  <input
                    type="number"
                    value={amountToConvert}
                    onChange={(e) => setAmountToConvert(e.target.value)}
                    placeholder="Amount in ETB"
                    className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>

                {/* Amount to withdraw */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Amount to withdraw (cash)
                  </label>
                  <input
                    type="number"
                    value={amountToWithdraw}
                    onChange={(e) => setAmountToWithdraw(e.target.value)}
                    placeholder="Amount in ETB"
                    required
                    className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Maximum: ETB {fmt(dividendData.total_dividend)}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Payment Method</p>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                      paymentMethod === 'bank-transfer' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200'
                    }`}
                  >
                    <input type="radio" name="payment" value="bank-transfer" checked={paymentMethod === 'bank-transfer'} onChange={() => setPaymentMethod('bank-transfer')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-800 flex items-center gap-2"><FaUniversity className="text-sky-500" /> Bank Transfer</span>
                      {paymentMethod === 'bank-transfer' && (
                        <div className="mt-3 space-y-2">
                          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" required className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10" />
                          <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch Name" className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10" />
                          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number" required className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10" />
                        </div>
                      )}
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                      paymentMethod === 'check' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200'
                    }`}
                  >
                    <input type="radio" name="payment" value="check" checked={paymentMethod === 'check'} onChange={() => setPaymentMethod('check')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                    <span className="font-medium text-slate-800">Receive by Check</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── Submit Button ── */}
            <button
              type="submit"
              disabled={!decision || isSubmitting}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-sky-500/30 ${
                !decision || isSubmitting ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <FaFileInvoiceDollar /> Submit Decision
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

/* ── Reusable Info Box ── */
function InfoBox({ icon: Icon, label, value, suffix }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="text-sky-500" /> {label}
      </div>
      <p className="mt-1 text-xl font-bold text-slate-800">
        {value} {suffix && <span className="text-xs font-medium text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}

/* ── Reusable Input Field ── */
function Field({ label, icon: Icon, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Icon className="text-slate-400 text-sm" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="block w-full rounded-lg border border-sky-100 bg-white py-2.5 pl-10 pr-3 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
        />
      </div>
    </div>
  );
}
