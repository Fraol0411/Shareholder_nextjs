'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaMoneyBillWave, FaChartLine, FaBank, FaFileInvoiceDollar } from 'react-icons/fa';
import AppShell from 'src/components/AppShell';
import { useTranslation } from '../../components/LanguageProvider';


export default function ShareholderDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [decision, setDecision] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Ethiopian shareholder data with Amharic names
  const shareholderData = {
    name: "አለማየው መኮንን",
    fileNumber: "AW-2023-4567",
    phone: "+251 912 345 678",
    email: "alex@example.com",
    paidUpCapital: 50000,
    grossDividend: 7500,
    dividendBroughtForward: 1200,
    totalDividendBalance: 8700,
    accountNumber: "1000234567890",
    bankName: "አዋሽ ባንክ", // Awash Bank
    joinDate: "ጥር 15, 2015" // Tir 15, 2015 (Ethiopian date)
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      alert(`እድራችሁ ተሰጥቷል! ውሳኔዎ ተጠናቅቋል: ${decision === 'reinvest' ? 'በአክሲዮን እንደገና መዋስ' : 'ገንዘቡን መውሰድ'}`);
      setIsSubmitting(false);
    }, 1500);
  };

  const handleLogout = () => {
    router.push('/login');
  };
  const handleform = () => {
    router.push('/fillform');
  };

  return (

      <AppShell>
          <div className="py-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-2">{t('dashboard.welcome')}</h2>
              <p className="opacity-90">{t('dashboard.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-slate-700">
                <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <FaUserCircle className="mr-2" /> {t('dashboard.personalInfo')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.fileNumber')}</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 mt-1">{shareholderData.fileNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.email')}</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 mt-1">{shareholderData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.phone')}</p>
                      <p className="font-medium text-gray-800 dark:text-gray-100 mt-1">{shareholderData.phone}</p>
                    </div>
                    {/* <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">የተመዘገበበት ዘመን</p>
                      <p className="font-medium text-gray-800 mt-1">{shareholderData.joinDate} ጀምሮ</p>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Dividend Summary Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-slate-700 lg:col-span-2">
                <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <FaMoneyBillWave className="mr-2" /> {t('dashboard.dividendForm')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">{t('dashboard.paidCapital')}</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">ETB {shareholderData.paidUpCapital.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wider">{t('dashboard.grossDividend')}</p>
                      <p className="text-2xl font-bold text-green-800 mt-1">ETB {shareholderData.grossDividend.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">{t('dashboard.broughtForward')}</p>
                      <p className="text-2xl font-bold text-purple-800 mt-1">ETB {shareholderData.dividendBroughtForward.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Total Balance Highlight */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 mb-6 shadow-inner">
                    <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">{t('dashboard.totalDividend')}</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      ETB {shareholderData.totalDividendBalance.toLocaleString()}
                    </p>
                  </div>

                  {/* Decision Form */}
                  <form onSubmit={handleSubmit} className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                      <FaFileInvoiceDollar className="mr-2 text-blue-600" /> {t('dashboard.makeDecision')}
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="reinvest"
                            name="decision"
                            type="radio"
                            value="reinvest"
                            checked={decision === 'reinvest'}
                            onChange={() => setDecision('reinvest')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                        </div>
                        <label htmlFor="reinvest" className="ml-3 block">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.reinvestAll')}</span>
                          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{t('dashboard.reinvestAllHelp')}</p>
                        </label>
                      </div>

                    <div className="flex items-start p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="reinvestyear"
                            name="decision"
                            type="radio"
                            value="reinvest"
                            checked={decision === 'reinvestyear'}
                            onChange={() => setDecision('reinvestyear')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                        </div>
                        <label htmlFor="reinvest" className="ml-3 block">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.reinvestYear')}</span>
                          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{t('dashboard.reinvestYear')}</p>
                        </label>
                      </div>

                      <div className="flex items-start p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
                        <div className="flex items-center h-5 mt-1">
                          <input
                            id="withdraw"
                            name="decision"
                            type="radio"
                            value="withdraw"
                            checked={decision === 'withdraw'}
                            onChange={() => setDecision('withdraw')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                        </div>
                        <label htmlFor="withdraw" className="ml-3 block">
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.withdraw')}</span>
                          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{t('dashboard.withdrawHelp')}</p>
                        </label>
                      </div>

                        {decision === 'withdraw' && (
                          <div className="ml-7 mt-2 space-y-4 pl-4 border-l-2 border-blue-100">
                            {/* Option to leave some amount as capital */}
                            <div className="flex flex-col space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                              <label className="flex items-start space-x-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                />
                                <span className="text-gray-800 font-medium">
                                  ካልወሰድኩት ይትርፍ ድርሻ ላይ ወደ ካፒታል የሚዞር
                                </span>
                              </label>
                              <div className="pl-6">
                                <input
                                  type="text"
                                  placeholder="ወደ ካፒታል የሚዞር (ETB)"
                                  className="w-full text-gray-800 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Amount to withdraw */}
                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                              <div className="mb-2">
                                <label className="block text-gray-800 font-medium mb-1">
                                  {t('dashboard.cashAmount')}
                                </label>
                                <input
                                  type="text"
                                  placeholder={t('dashboard.amountPlaceholder')}
                                  className="w-full px-3 text-gray-800 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  max={shareholderData.totalDividendBalance}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {t('dashboard.maximum')}: ETB {shareholderData.totalDividendBalance.toLocaleString()}
                                </p>
                              </div>

                              {/* Payment method selection */}
                              <div className="mt-4 space-y-3">
                                <div className="flex items-start">
                                  <div className="flex items-center h-5 mt-1">
                                    <input
                                      id="bank-transfer"
                                      name="payment-method"
                                      type="radio"
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      checked={paymentMethod === 'bank-transfer'}
                                      onChange={() => setPaymentMethod('bank-transfer')}
                                    />
                                  </div>
                                  
                                  <label htmlFor="bank-transfer" className="ml-3 block">
                                    <span className="font-medium text-gray-800 dark:text-gray-100">{t('dashboard.bankTransfer')}</span>
                                    {paymentMethod === 'bank-transfer' && (
                                      <div className="mt-2 space-y-2">
                                        <input
                                          type="text"
                                          placeholder={t('dashboard.bankName')}
                                          defaultValue={shareholderData.bankName}
                                          className="w-full px-3 py-2 text-gray-800 text-sm border border-gray-300 rounded-md"
                                        />
                                        <input
                                          type="text"
                                          placeholder={t('dashboard.branchName')}
                                          className="w-full px-3 py-2 text-gray-800 text-sm border border-gray-300 rounded-md"
                                        />
                                        <input
                                          type="text"
                                          placeholder={t('dashboard.accountNumber')}
                                          defaultValue={shareholderData.accountNumber}
                                          className="w-full px-3 py-2 text-sm border text-gray-800 border-gray-300 rounded-md"
                                        />
                                      </div>
                                    )}
                                  </label>
                                </div>

                                <div className="flex items-start">
                                  <div className="flex items-center h-5 mt-1">
                                    <input
                                      id="check"
                                      name="payment-method"
                                      type="radio"
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                      checked={paymentMethod === 'check'}
                                      onChange={() => setPaymentMethod('check')}
                                    />
                                  </div>
                                  <label htmlFor="check" className="ml-3 block">
                                    <span className="font-medium text-gray-800 dark:text-gray-100">{t('dashboard.check')}</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={!decision || isSubmitting}
                          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                            !decision || isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t('dashboard.submitting')}
                            </span>
                          ) : t('dashboard.submit')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
       </AppShell>
  );
}
