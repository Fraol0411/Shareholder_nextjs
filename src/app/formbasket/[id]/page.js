'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaFileInvoiceDollar, FaUserCircle, FaMoneyBillWave, FaBank, FaPiggyBank } from 'react-icons/fa';
import AppShell from '../../../components/AppShell';

export default function FormDetail() {
  const router = useRouter();
  const { id } = useParams(); // ✅ Correct way to get dynamic param in App Router

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchForm = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return router.push('/login');
        }

        const res = await fetch(`/api/dividend/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          cache: 'no-store', // Optional: prevent caching
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to load form (Status: ${res.status})`);
        }

        const data = await res.json();
        setForm(data);
      } catch (err) {
        console.error('Fetch error:', err); // 🔥 Debug
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-600">Loading form details...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="max-w-md rounded-lg bg-red-50 p-6 text-red-700">
            <strong>Error:</strong> {error}
            <button
              onClick={() => router.push('/formbasket')}
              className="mt-3 block text-sm underline"
            >
              ← Back to Form Basket
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!form) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-600">Form not found.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold flex items-center">
            <FaFileInvoiceDollar className="mr-2" />
            Form Details
          </h2>
          <p className="opacity-90">Full information about dividend decision #{id}</p>
        </div>

        {/* Form Details */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 space-y-6">
          {/* File & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Number</label>
              <p className="text-gray-800 font-medium">{form.file_number}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
              <p className="text-gray-800 font-medium">
                {new Date(form.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Shareholder Info */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaUserCircle className="mr-2" /> Shareholder Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-800">{form.shareholder_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-800">{form.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-800">{form.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fiscal Year</label>
                <p className="text-gray-800">{form.fiscal_year}</p>
              </div>
            </div>
          </div>

          {/* Decision Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaMoneyBillWave className="mr-2" /> Decision Summary
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Decision Type</label>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    form.decision_type === 'withdraw'
                      ? 'bg-red-100 text-red-800'
                      : form.decision_type === 'fiscalreinvest'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {form.decision_type === 'reinvest'
                    ? 'Reinvest Full Dividend'
                    : form.decision_type === 'fiscalreinvest'
                    ? 'Reinvest This Year Dividend'
                    : 'Withdraw Dividend'}
                </span>
              </div>

              {form.amount_to_convert && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount Reinvested (ETB)</label>
                  <p className="text-gray-800 font-medium">
                    {parseFloat(form.amount_to_convert).toLocaleString()}
                  </p>
                </div>
              )}

              {form.amount_to_withdraw && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount to Withdraw (ETB)</label>
                  <p className="text-gray-800 font-medium">
                    {parseFloat(form.amount_to_withdraw).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          {form.decision_type === 'withdraw' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaPiggyBank className="mr-2" /> Payment Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="text-gray-800 capitalize">
                    {form.payment_method?.replace('-', ' ') || 'Not specified'}
                  </p>
                </div>

                {form.payment_method === 'bank-transfer' && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <p className="text-gray-800">{form.bank_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                      <p className="text-gray-800">{form.branch_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number</label>
                      <p className="text-gray-800">{form.account_number || '-'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submitted By */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Submitted By</h3>
            <p className="text-gray-800">
              <FaUserCircle className="inline mr-1 text-blue-600" />
              {form.entered_by_name || 'Unknown Staff'}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}