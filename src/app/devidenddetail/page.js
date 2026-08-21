'use client';

import { useState, useEffect } from 'react';
import { 
  FaCalendarAlt, FaWallet, FaChartLine, FaHistory, FaMoneyBillWave, 
  FaUser, FaIdCard, FaPhone, FaSpinner, FaExclamationTriangle, FaBuilding,
  FaHashtag
} from 'react-icons/fa';
import AppShell from '../../components/AppShell'; // Update path based on your project structure

export default function DividendDetail() {
  const [regNo, setRegNo] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Retrieves the reg_no saved during login
    const storedRegNo = localStorage.getItem('reg_no'); 
    if (storedRegNo) {
      setRegNo(storedRegNo);
      fetchDetails(storedRegNo, '');
    } else {
      setIsLoading(false);
      setError('User registration number not found. Please log in again.');
    }
  }, []);

  const fetchDetails = async (currentRegNo, year) => {
    setIsLoading(true);
    setError('');
    try {
      const url = year 
        ? `/api/dividend-detail?reg_no=${encodeURIComponent(currentRegNo)}&fiscal_year=${encodeURIComponent(year)}`
        : `/api/dividend-detail?reg_no=${encodeURIComponent(currentRegNo)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      
      setFiscalYears(data.fiscalYears || []);
      
      if (!year && data.fiscalYears && data.fiscalYears.length > 0) {
        // Auto-select the most recent fiscal year on initial load
        const firstYear = data.fiscalYears[0];
        setSelectedYear(firstYear);
        fetchDetails(currentRegNo, firstYear);
        return;
      }

      if (data.records && data.records.length > 0) {
        setRecord(data.records[0]);
      } else {
        setRecord(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    if (regNo && year) {
      fetchDetails(regNo, year);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header & Fiscal Year Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Dividend Portfolio</h2>
            <p className="text-gray-500 mt-1">Track your capital, declared dividends, and historical balances.</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={handleYearChange}
              disabled={fiscalYears.length === 0}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fiscalYears.length === 0 ? (
                <option>No fiscal years found</option>
              ) : (
                fiscalYears.map((y) => (
                  <option key={y} value={y}>Fiscal Year: {y}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* States: Loading, Error, Empty, Success */}
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
             <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
             <p className="text-gray-500 font-medium">Loading your financial records...</p>
           </div>
        ) : error ? (
           <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4 text-red-700">
             <FaExclamationTriangle className="text-2xl" />
             <p className="font-medium">{error}</p>
           </div>
        ) : !record ? (
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
             <FaHistory className="mx-auto text-5xl text-gray-300 mb-4" />
             <h3 className="text-lg font-semibold text-gray-800">No Records Found</h3>
             <p className="text-gray-500 mt-1">There are no dividend records for your account in the selected fiscal year.</p>
           </div>
        ) : (
          <>
            {/* Financial Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard 
                label="Paid-up Capital" 
                value={record.paidup_capital} 
                icon={FaWallet} 
                gradient="from-blue-500 to-indigo-600"
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              <MetricCard 
                label="Dividend Declared" 
                value={record.dividend_declared} 
                icon={FaChartLine} 
                gradient="from-emerald-500 to-green-600"
                bgColor="bg-emerald-50"
                textColor="text-emerald-600"
              />
              <MetricCard 
                label="Dividend B/F" 
                value={record.dividend_bf} 
                icon={FaHistory} 
                gradient="from-purple-500 to-fuchsia-600"
                bgColor="bg-purple-50"
                textColor="text-purple-600"
              />
              <MetricCard 
                label="Total Dividend" 
                value={record.total_dividend} 
                icon={FaMoneyBillWave} 
                gradient="from-amber-500 to-orange-600"
                bgColor="bg-amber-50"
                textColor="text-amber-600"
              />
            </div>

            {/* Shareholder Profile Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-2">
                <FaUser className="text-gray-700" />
                <h3 className="text-lg font-bold text-gray-800">Shareholder Profile Information</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <InfoItem icon={FaHashtag} label="Registration No" value={record.reg_no} />
                <InfoItem icon={FaBuilding} label="SIF No" value={record.sif_no} />
                <InfoItem icon={FaUser} label="Full Name" value={record.sh_name} />
                <InfoItem icon={FaPhone} label="Phone Number" value={record.phone} />
                <InfoItem icon={FaIdCard} label="National ID" value={record.national_id} />
                <InfoItem icon={FaCalendarAlt} label="Fiscal Year" value={record.fiscal_year} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ------------------------- Reusable UI Components ------------------------- */

function MetricCard({ label, value, icon: Icon, gradient, bgColor, textColor }) {
  const formatted = Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden group hover:shadow-md transition-all">
      {/* Decorative background blur */}
      <div className={`absolute -right-6 -top-6 w-28 h-28 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${bgColor} ${textColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1 relative z-10">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight relative z-10">
        {formatted} <span className="text-sm font-normal text-gray-400">ETB</span>
      </p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-500 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-base font-medium text-gray-800 mt-0.5 break-words">{value || 'N/A'}</p>
      </div>
    </div>
  );
}