'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaMoneyBillWave, FaFileInvoiceDollar } from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { useTranslation } from '../../components/LanguageProvider';

export default function ShareholderDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [decision, setDecision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Static shareholder data (can be replaced with real data later)
  const shareholderData = {
    name: "Alemayehu Mekonnen",
    totalDividendBalance: 8700,
    accountNumber: "1000234567890",
    bankName: "Bank Name",
    branchName: "Addis Ababa Branch",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision) return;

    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const data = {
      file_number: formData.get('file_number'),
      shareholder_name: formData.get('shareholder_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      fiscal_year: formData.get('fiscal_year'),
      decision_type: decision,
      amount_to_convert: formData.get('amount_to_convert') || null,
      amount_to_withdraw: formData.get('amount_to_withdraw') || null,
      payment_method: paymentMethod,
      bank_name: formData.get('bank_name') || null,
      branch_name: formData.get('branch_name') || null,
      account_number: formData.get('account_number') || null,
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/dividend/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Submission failed');
      }

      alert('✅ Your decision has been submitted successfully!');
      router.push('/formbasket');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{t('form.panel')}</h2>
          <p className="opacity-90">{t('form.description')}</p>
        </div>

        {/* Dividend Decision Form */}
        <div className="theme-surface rounded-xl shadow-md border">
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FaMoneyBillWave className="mr-2" /> {t('form.title')}
            </h3>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="theme-surface-muted p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('form.fileNumber')}</label>
                  <input name="file_number" type="text" placeholder={t('form.fileNumber')} className="theme-control w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="theme-surface-muted p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('form.date')}</label>
                  <input name="date" type="date" className="theme-control w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="theme-surface-muted p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('form.fiscalYear')}</label>
                  <select name="fiscal_year" className="theme-control w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>

                <div className="theme-surface-muted p-4 border rounded-lg md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('form.shareholderName')}</label>
                  <input name="shareholder_name" type="text" placeholder={t('form.shareholderName')} className="theme-control w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="theme-surface-muted p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('form.email')}</label>
                  <input name="email" type="email" placeholder={t('form.email')} className="theme-control w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="theme-surface-muted p-4 border rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('form.phone')}</label>
                  <input name="phone" type="tel" placeholder={t('form.phone')} className="theme-control w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Decision Section */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaFileInvoiceDollar className="mr-2 text-blue-600" /> {t('form.decision')}
              </h3>

              <div className="space-y-4">
                {/* Reinvest Option */}
                <div className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input id="reinvest" name="decision" type="radio" value="reinvest" checked={decision === 'reinvest'} onChange={() => setDecision('reinvest')} className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <label htmlFor="reinvest" className="ml-3">
                    <span className="font-semibold text-gray-800">Reinvest my full dividend in capital</span>
                    <p className="text-gray-600 text-sm mt-1">All undrawn dividend will be converted to capital</p>
                  </label>
                </div>

                 {/* Fiscal Reinvest Option (FIXED: Unique IDs and Values) */}
                 <div className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input id="fiscalreinvest" name="decision" type="radio" value="fiscalreinvest" checked={decision === 'fiscalreinvest'} onChange={() => setDecision('fiscalreinvest')} className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <label htmlFor="fiscalreinvest" className="ml-3">
                    <span className="font-semibold text-gray-800"> Reinvest this fiscal year dividend in capital </span>
                    <p className="text-gray-600 text-sm mt-1"> All this year dividend will be converted to capital </p>
                  </label>
                </div>

                {/* Withdraw Option */}
                <div className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input id="withdraw" name="decision" type="radio" value="withdraw" checked={decision === 'withdraw'} onChange={() => setDecision('withdraw')} className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <label htmlFor="withdraw" className="ml-3">
                    <span className="font-semibold text-gray-800">Withdraw my dividend</span>
                    <p className="text-gray-600 text-sm mt-1">Receive your dividend as cash payment</p> 
                  </label>
                </div>

                {/* Conditional Fields: Withdraw Selected */}
                {decision === 'withdraw' && (
                  <div className="ml-7 mt-3 space-y-4 pl-4 border-l-2 border-blue-100">
                    {/* Partial Reinvestment */}
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <label className="flex items-start space-x-2">
                        <input type="checkbox" className="h-4 w-4 mt-1 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                        <span className="font-medium text-gray-800">Convert portion of undrawn dividend to capital</span>
                      </label>
                      <div className="pl-6 mt-2">
                        <input name="amount_to_convert" type="text" placeholder="Amount to convert to capital (ETB)" className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>

                    {/* Withdraw Amount */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="mb-2">
                        <label className="block font-medium text-gray-800 mb-1">Amount to be paid in cash</label>
                        <input name="amount_to_withdraw" type="text" placeholder="Amount to withdraw (ETB)" className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <p className="text-xs text-gray-500 mt-1">Maximum amount: ETB {shareholderData.totalDividendBalance.toLocaleString()}</p>
                      </div>

                      {/* Payment Method */}
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start">
                          <input id="bank-transfer" name="payment-method" type="radio" checked={paymentMethod === 'bank-transfer'} onChange={() => setPaymentMethod('bank-transfer')} className="h-4 w-4 mt-1 text-blue-600 border-gray-300 focus:ring-blue-500" />
                          <label htmlFor="bank-transfer" className="ml-3">
                            <span className="font-medium text-gray-800">Bank Transfer</span>
                            {paymentMethod === 'bank-transfer' && (
                              <div className="mt-2 space-y-2">
                                <input name="bank_name" type="text" placeholder="Bank Name" defaultValue={shareholderData.bankName} className="w-full px-3 py-2 text-sm border text-gray-800 border-gray-300 rounded-md" />
                                {/* FIXED: defaultValue instead of defaultChecked */}
                                <input name="branch_name" type="text" placeholder="Branch Name" defaultValue={shareholderData.branchName} className="w-full px-3 py-2 text-sm border text-gray-800 border-gray-300 rounded-md" />
                                <input name="account_number" type="text" placeholder="Account Number" defaultValue={shareholderData.accountNumber} className="w-full px-3 py-2 text-sm border text-gray-800 border-gray-300 rounded-md" />
                              </div>
                            )}
                          </label>
                        </div>

                        <div className="flex items-start">
                          <input id="check" name="payment-method" type="radio" checked={paymentMethod === 'check'} onChange={() => setPaymentMethod('check')} className="h-4 w-4 mt-1 text-blue-600 border-gray-300 focus:ring-blue-500" />
                          <label htmlFor="check" className="ml-3">
                            <span className="font-medium text-gray-800">Receive by Check</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-6">
                  <button type="submit" disabled={!decision || isSubmitting} className={`w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${!decision || isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isSubmitting ? (
                      <span className="flex justify-center items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Your Decision'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}