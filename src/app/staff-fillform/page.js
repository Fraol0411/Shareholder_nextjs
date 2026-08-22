'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaSearch, FaFileInvoiceDollar, FaChartLine, FaWallet, FaHistory,
  FaMoneyBillWave, FaUser, FaPhone, FaEnvelope, FaUniversity,
  FaExclamationCircle, FaCheckCircle, FaCalendarAlt, FaTimes,
  FaSpinner, FaUserTie,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { getToken, getStoredUser, isStaffRole } from '../../libs/auth';

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StaffFillForm() {
  const router = useRouter();

  // ── Auth ──
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // ── Fiscal years & shareholders ──
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [shareholders, setShareholders] = useState([]);
  const [loadingShareholders, setLoadingShareholders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Selected shareholder ──
  const [selectedSH, setSelectedSH] = useState(null);

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

  // ── Submission ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Auth check ──
  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (!t || !u || !isStaffRole(u.role)) {
      router.replace('/login');
      return;
    }
    setToken(t);
    setUser(u);
  }, [router]);

  // ── Load fiscal years ──
  useEffect(() => {
    fetch('/api/fiscal-years')
      .then((r) => r.json())
      .then((data) => setFiscalYears(data || []))
      .catch(() => {});
  }, []);

  // ── Load shareholders when fiscal year changes ──
  useEffect(() => {
    if (!selectedYear) {
      setShareholders([]);
      return;
    }
    setLoadingShareholders(true);
    setSelectedSH(null);
    resetForm();

    fetch(`/api/shareholders?fiscal_year=${encodeURIComponent(selectedYear)}`)
      .then((r) => r.json())
      .then((data) => setShareholders(data || []))
      .catch(() => setShareholders([]))
      .finally(() => setLoadingShareholders(false));
  }, [selectedYear]);

  // ── Filtered shareholders ──
  const filteredShareholders = useMemo(() => {
    if (!searchTerm) return shareholders;
    const term = searchTerm.toLowerCase();
    return shareholders.filter(
      (s) =>
        (s.sh_name && s.sh_name.toLowerCase().includes(term)) ||
        (s.reg_no && s.reg_no.toLowerCase().includes(term)) ||
        (s.sif_no && s.sif_no.toLowerCase().includes(term)) ||
        (s.phone && String(s.phone).includes(term)) ||
        (s.national_id && String(s.national_id).includes(term))
    );
  }, [shareholders, searchTerm]);

  // ── Select a shareholder ──
  const handleSelectShareholder = (sh) => {
    setSelectedSH(sh);
    setShareholderName(sh.sh_name || '');
    setPhone(sh.phone || '');
    setEmail('');
    setDecision('');
    setPaymentMethod('');
    setAmountToConvert('');
    setAmountToWithdraw('');
    setBankName('');
    setBranchName('');
    setAccountNumber('');
    setSuccess('');
    setError('');
  };

  const resetForm = () => {
    setShareholderName('');
    setEmail('');
    setPhone('');
    setDecision('');
    setPaymentMethod('');
    setAmountToConvert('');
    setAmountToWithdraw('');
    setBankName('');
    setBranchName('');
    setAccountNumber('');
    setSuccess('');
    setError('');
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision || !selectedSH) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/decisions/staff-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedSH.user_id,
          sh_dividend_id: selectedSH.id,
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
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Submission failed');

      setSuccess(`Decision submitted successfully for ${shareholderName}!`);
      resetForm();
      setSelectedSH(null);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Fill Decision Form <span className="text-sky-500">(Staff)</span>
          </h1>
          <p className="mt-2 text-slate-500">
            Search for a shareholder, review their dividend details, and submit a decision on their behalf.
          </p>
        </div>

        {/* ── Success / Error ── */}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm">
            <FaExclamationCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Fiscal Year ── */}
        <div className="mb-6 rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FaCalendarAlt className="text-sky-500" /> Select Fiscal Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setSearchTerm(''); }}
            className="block w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10"
          >
            <option value="">-- Choose a fiscal year --</option>
            {fiscalYears.map((fy) => <option key={fy} value={fy}>{fy}</option>)}
          </select>
        </div>

        {/* ── Step 2: Search & Select Shareholder ── */}
        {selectedYear && (
          <div className="mb-6 rounded-xl border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                <FaSearch className="text-sky-600" /> Find Shareholder
              </h3>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name, reg no, phone, SIF no, national ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-100 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 shadow-sm"
                />
              </div>

              {loadingShareholders ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-sky-500" />
                </div>
              ) : filteredShareholders.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  <FaUserTie className="mx-auto text-4xl text-slate-200 mb-3" />
                  {searchTerm ? 'No shareholders match your search.' : 'No shareholders found for this fiscal year.'}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-sky-50">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Reg No</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Total Dividend</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Phone</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Select</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50">
                      {filteredShareholders.map((sh) => (
                        <tr
                          key={sh.id}
                          className={`cursor-pointer transition-colors hover:bg-sky-50/60 ${selectedSH?.id === sh.id ? 'bg-sky-50 ring-1 ring-sky-300' : ''}`}
                          onClick={() => handleSelectShareholder(sh)}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">{sh.sh_name}</td>
                          <td className="px-4 py-3 text-slate-600">{sh.reg_no}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(sh.total_dividend)}</td>
                          <td className="px-4 py-3 text-slate-600">{sh.phone}</td>
                          <td className="px-4 py-3 text-center">
                            {selectedSH?.id === sh.id ? (
                              <FaCheckCircle className="inline text-sky-600" />
                            ) : (
                              <span className="text-xs text-sky-500 font-medium">Select</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Dividend Summary ── */}
        {selectedSH && (
          <div className="mb-6 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                <FaChartLine className="text-sky-600" />
                Dividend Summary — {selectedSH.sh_name} (FY {selectedYear})
              </h3>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <InfoBox icon={FaWallet} label="Paid-up Capital" value={fmt(selectedSH.paidup_capital)} />
              <InfoBox icon={FaChartLine} label="Dividend Declared" value={fmt(selectedSH.dividend_declared)} />
              <InfoBox icon={FaHistory} label="Dividend B/F" value={fmt(selectedSH.dividend_bf)} />
              <div className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600">
                  <FaMoneyBillWave /> Total Dividend
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-800">
                  {fmt(selectedSH.total_dividend)} <span className="text-xs font-medium text-sky-500">ETB</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Decision Form ── */}
        {selectedSH && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <FaUser className="text-sky-500" /> Shareholder Information
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
                <FaFileInvoiceDollar className="text-sky-500" /> Choose Decision
              </h3>
              <div className="space-y-3">
                <RadioCard name="reinvest" checked={decision === 'reinvest'} onChange={setDecision}
                  title="Reinvest full dividend in capital" desc="All undrawn dividend will be converted to capital." />
                <RadioCard name="fiscalreinvest" checked={decision === 'fiscalreinvest'} onChange={setDecision}
                  title="Reinvest this fiscal year dividend in capital" desc="Only this year's dividend will be converted to capital." />
                <RadioCard name="withdraw" checked={decision === 'withdraw'} onChange={setDecision}
                  title="Withdraw dividend" desc="Receive the dividend as a cash payment." />
              </div>
            </div>

            {/* Withdraw Details */}
            {decision === 'withdraw' && (
              <div className="space-y-4 rounded-xl border border-sky-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                  <FaMoneyBillWave className="text-sky-500" /> Withdrawal Details
                </h3>
                <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-4">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Portion to convert to capital (optional)</label>
                  <input type="number" value={amountToConvert} onChange={(e) => setAmountToConvert(e.target.value)} placeholder="Amount in ETB"
                    className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Amount to withdraw (cash)</label>
                  <input type="number" value={amountToWithdraw} onChange={(e) => setAmountToWithdraw(e.target.value)} placeholder="Amount in ETB" required
                    className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10" />
                  <p className="mt-1 text-xs text-slate-400">Maximum: ETB {fmt(selectedSH.total_dividend)}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Payment Method</p>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${paymentMethod === 'bank-transfer' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200'}`}>
                    <input type="radio" checked={paymentMethod === 'bank-transfer'} onChange={() => setPaymentMethod('bank-transfer')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                    <div className="flex-1">
                      <span className="font-medium text-slate-800 flex items-center gap-2"><FaUniversity className="text-sky-500" /> Bank Transfer</span>
                      {paymentMethod === 'bank-transfer' && (
                        <div className="mt-3 space-y-2">
                          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" required className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none" />
                          <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch Name" className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none" />
                          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number" required className="block w-full rounded-lg border border-sky-100 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${paymentMethod === 'check' ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200'}`}>
                    <input type="radio" checked={paymentMethod === 'check'} onChange={() => setPaymentMethod('check')} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
                    <span className="font-medium text-slate-800">Receive by Check</span>
                  </label>
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={!decision || isSubmitting}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-sky-500/30 ${!decision || isSubmitting ? 'cursor-not-allowed opacity-70' : 'hover:-translate-y-0.5'}`}>
              {isSubmitting ? (<><FaSpinner className="animate-spin" /> Submitting...</>) : (<><FaFileInvoiceDollar /> Submit Decision on Behalf</>)}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

/* ── Info Box ── */
function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Icon className="text-sky-500" /> {label}</div>
      <p className="mt-1 text-xl font-bold text-slate-800">{value} <span className="text-xs font-medium text-slate-400">ETB</span></p>
    </div>
  );
}

/* ── Input Field ── */
function Field({ label, icon: Icon, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Icon className="text-slate-400 text-sm" /></div>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
          className="block w-full rounded-lg border border-sky-100 bg-white py-2.5 pl-10 pr-3 text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10" />
      </div>
    </div>
  );
}

/* ── Radio Card ── */
function RadioCard({ name, checked, onChange, title, desc }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${checked ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'}`}>
      <input type="radio" name="decision" value={name} checked={checked} onChange={() => onChange(name)} className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500" />
      <div>
        <span className="font-semibold text-slate-800">{title}</span>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
    </label>
  );
}
