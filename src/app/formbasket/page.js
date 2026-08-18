'use client';

import { useEffect, useState } from 'react';
import { FaFileInvoiceDollar, FaFilter, FaSearch } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

export default function FormBasket() {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [fiscalYear, setFiscalYear] = useState(''); // ← Starts empty
  const [decisionType, setDecisionType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();

  // Fetch forms only when fiscal year is selected
  useEffect(() => {
    if (!fiscalYear) {
      setLoading(false);
      setForms([]);
      setFilteredForms([]);
      return;
    }

    const fetchForms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return router.push('/login');
        }

        const res = await fetch('/api/dividend/list', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load forms');

        const data = await res.json();

        // Optional: Filter on client by fiscal_year if API doesn't
        const filteredByYear = data.filter(f => f.fiscal_year === fiscalYear);

        setForms(filteredByYear);
        setFilteredForms(filteredByYear);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [fiscalYear, router]);

  // Apply additional filters only after fiscal year is selected
  useEffect(() => {
    if (!fiscalYear) {
      setFilteredForms([]);
      return;
    }

    let result = [...forms];

    if (decisionType) {
      result = result.filter(f => f.decision_type === decisionType);
    }
    if (paymentMethod) {
      result = result.filter(f => f.payment_method === paymentMethod);
    }
    if (amountFrom) {
      result = result.filter(f => f.amount_to_withdraw >= parseFloat(amountFrom));
    }
    if (amountTo) {
      result = result.filter(f => f.amount_to_withdraw <= parseFloat(amountTo));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f =>
        f.file_number.toLowerCase().includes(term) ||
        f.shareholder_name.toLowerCase().includes(term)
      );
    }

    setFilteredForms(result);
  }, [
    fiscalYear,
    forms,
    decisionType,
    paymentMethod,
    amountFrom,
    amountTo,
    searchTerm
  ]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold flex items-center">
            <FaFileInvoiceDollar className="mr-2" />
            Form Basket – Dividend Decisions
          </h2>
          <p className="opacity-90">Select a fiscal year to view and filter forms</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FaFilter className="mr-2" /> Filter Forms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fiscal Year (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year *</label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
              </select>
            </div>

            {/* Decision Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision Type</label>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value)}
                disabled={!fiscalYear}
                className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Types</option>
                <option value="reinvest">Reinvest Full</option>
                <option value="fiscalreinvest">Reinvest This Year</option>
                <option value="withdraw">Withdraw</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={!fiscalYear}
                className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Methods</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="check">Check</option>
              </select>
            </div>

            {/* Amount From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Withdraw Amount (ETB)</label>
              <input
                type="number"
                value={amountFrom}
                onChange={(e) => setAmountFrom(e.target.value)}
                placeholder="e.g. 5000"
                disabled={!fiscalYear}
                className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Amount To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Withdraw Amount (ETB)</label>
              <input
                type="number"
                value={amountTo}
                onChange={(e) => setAmountTo(e.target.value)}
                placeholder="e.g. 10000"
                disabled={!fiscalYear}
                className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="File # or Name"
                  disabled={!fiscalYear}
                  className="w-full pl-10 px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && fiscalYear && (
          <div className="text-center py-10">
            <p className="text-gray-600">Loading forms for {fiscalYear}...</p>
          </div>
        )}

        {/* No Fiscal Year Selected */}
        {!fiscalYear && (
          <div className="text-center py-16">
            <FaFileInvoiceDollar className="mx-auto text-gray-300 text-6xl mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Fiscal Year</h3>
            <p className="text-gray-500 mb-4">Please choose a fiscal year above to view dividend forms.</p>
            <p className="text-sm text-gray-400">This helps reduce load time and focus on relevant data.</p>
          </div>
        )}

        {/* Data Table (Only shown after fiscal year is selected and loaded) */}
        {fiscalYear && !loading && !error && (
          <>
            {/* Results Count */}
            <div className="mb-4 text-gray-700">
              Showing <strong>{filteredForms.length}</strong> of <strong>{forms.length}</strong> form(s) for {fiscalYear}
            </div>

            {filteredForms.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No forms match your filters.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shareholder</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Withdraw (ETB)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredForms.map((form) => (
                        <tr
                          key={form.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/formbasket/${form.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">{form.file_number}</td>
                          <td className="px-6 py-4 text-gray-800">{form.shareholder_name}</td>
                          <td className="px-6 py-4 text-gray-800">{form.fiscal_year}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                form.decision_type === 'withdraw'
                                  ? 'bg-red-100 text-red-800'
                                  : form.decision_type === 'fiscalreinvest'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {form.decision_type === 'reinvest'
                                ? 'Reinvest Full'
                                : form.decision_type === 'fiscalreinvest'
                                ? 'Reinvest FY'
                                : 'Withdraw'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-800">
                            {form.amount_to_withdraw?.toLocaleString() || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-800 capitalize">
                            {form.payment_method?.replace('-', ' ') || '-'}
                          </td>
                          <td className="px-6 py-4 text-gray-800">{form.entered_by_name || 'Staff'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && fiscalYear && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700"><strong>Error:</strong> {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}