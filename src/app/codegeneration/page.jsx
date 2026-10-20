'use client';

import { useState } from 'react';
import { FaDownload, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaInfoCircle } from 'react-icons/fa';

export default function GenerateOTPPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async () => {
    // Safety confirmation before updating all users
    const confirmed = window.confirm(
      '⚠️ WARNING: This will generate a new 4-digit OTP for ALL users in the database and immediately download the CSV file.\n\nAre you sure you want to proceed?'
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/generate-otp-csv', {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate OTPs');
      }

      // Handle file download from the blob response
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sms_template_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('OTPs generated successfully and CSV downloaded!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-[#0b1120] sm:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Bulk OTP Generation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate 4-digit verification codes for users and download the SMS server template.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            <FaExclamationTriangle className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="p-6 sm:p-8">
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2">
                <FaInfoCircle className="text-brand-primary dark:text-brand-secondary" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  How it works
                </h2>
              </div>
              <ul className="list-inside list-disc space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>Generates a random 4-digit OTP for every user with a phone number.</li>
                <li>Updates the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-700 dark:text-slate-200">otp</code>, <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-700 dark:text-slate-200">otp_expires_at</code>, and tracking columns in the database.</li>
                <li>Automatically formats phone numbers to the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-700 dark:text-slate-200">251...</code> standard required by SMS gateways.</li>
                <li>Instantly downloads a <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-700 dark:text-slate-200">.csv</code> file ready to be uploaded to your SMS server.</li>
              </ul>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#2563eb] dark:shadow-[#2563eb]/25 dark:hover:bg-[#1d4ed8] sm:w-auto"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="h-5 w-5 animate-spin" />
                  <span>Generating & Downloading...</span>
                </>
              ) : (
                <>
                  <FaDownload className="h-5 w-5" />
                  <span>Generate Verification Codes & Download CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}