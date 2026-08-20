'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FaSearch, FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaTimes, FaSave,
  FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaCheckCircle,
  FaCalendarAlt, FaSpinner, FaUserTie
} from 'react-icons/fa';
import AppShell from '../../components/AppShell'; // Update path if needed

export default function ManageShareholders() {
  /* ------------------------------ State ------------------------------ */
  const [fiscalYears, setFiscalYears] = useState([]);
  const [fiscalYear, setFiscalYear] = useState('');
  const [shareholders, setShareholders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [pageJump, setPageJump] = useState('1');

  // Modals & toast
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  /* --------------------------- Data loading --------------------------- */
  useEffect(() => {
    fetchFiscalYears();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, fiscalYear]);

  useEffect(() => {
    setPageJump(String(currentPage));
  }, [currentPage]);

  const fetchFiscalYears = async () => {
    try {
      const res = await fetch('/api/fiscal-years');
      if (res.ok) setFiscalYears(await res.json());
    } catch {
      showNotification('error', 'Failed to load fiscal years.');
    }
  };

  const fetchData = async (year) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/shareholders?fiscal_year=${encodeURIComponent(year)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      setShareholders(await res.json());
    } catch {
      showNotification('error', 'Failed to load shareholders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiscalYearChange = (year) => {
    setFiscalYear(year);
    if (year) fetchData(year);
    else setShareholders([]);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  /* ------------------------- Sorting & filtering ------------------------- */
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredData = useMemo(() => {
    const filtered = shareholders.filter(
      (s) =>
        (s.sh_name && s.sh_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.reg_no && s.reg_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.sif_no && s.sif_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && String(s.phone).includes(searchTerm)) ||
        (s.national_id && String(s.national_id).includes(searchTerm))
    );

    const numericCols = ['id', 'sn', 'paidup_capital', 'dividend_declared', 'dividend_bf', 'total_dividend'];

    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (numericCols.includes(sortConfig.key)) {
        const numA = parseFloat(valA) || 0;
        const numB = parseFloat(valB) || 0;
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shareholders, searchTerm, sortConfig]);

  /* ------------------------------ Pagination ------------------------------ */
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getPaginationRange = (total, current) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };

  const commitPageJump = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) setCurrentPage(Math.min(Math.max(1, num), totalPages));
    else setPageJump(String(currentPage));
  };

  /* ------------------------------ CRUD actions ------------------------------ */
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/shareholders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, reg_no: deleteTarget.reg_no }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setShareholders((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showNotification('success', 'Record deleted successfully.');
      setDeleteTarget(null);
    } catch {
      showNotification('error', 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/shareholders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (!res.ok) throw new Error('Update failed');
      setShareholders((prev) => prev.map((s) => (s.id === editingItem.id ? editingItem : s)));
      setEditingItem(null);
      showNotification('success', 'Record updated successfully.');
    } catch {
      showNotification('error', 'Failed to update record.');
    } finally {
      setIsSaving(false);
    }
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <FaSort className="text-gray-300 ml-1" />;
    return sortConfig.direction === 'asc' ? (
      <FaSortUp className="text-blue-600 ml-1" />
    ) : (
      <FaSortDown className="text-blue-600 ml-1" />
    );
  };

  const fmtMoney = (v) =>
    Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* --------------------------------- Render --------------------------------- */
  return (
    <AppShell>
      {/* Animations */}
      <style>{`
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Modern Toast */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600'
              : 'bg-gradient-to-r from-red-600 to-rose-600'
          }`}
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          {notification.type === 'success' ? <FaCheckCircle className="text-lg" /> : <FaExclamationTriangle className="text-lg" />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 opacity-80 hover:opacity-100">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Shareholders</h2>
          <p className="text-gray-500 mt-1">View, edit, and manage uploaded dividend data.</p>
        </div>

        {/* Toolbar: Search + Fiscal Year */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search name, reg no, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={fiscalYear}
              onChange={(e) => handleFiscalYearChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
            >
              <option value="">Select Fiscal Year</option>
              {fiscalYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['id', 'sh_name', 'reg_no', 'sif_no', 'paidup_capital', 'total_dividend', 'phone', 'fiscal_year'].map((col) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    >
                      <div className="flex items-center">
                        <span>{col.replace(/_/g, ' ')}</span>
                        <SortIcon column={col} />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {!fiscalYear ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center">
                      <FaCalendarAlt className="mx-auto text-5xl text-gray-200 mb-4" />
                      <h3 className="text-base font-medium text-gray-700">No fiscal year selected</h3>
                      <p className="text-sm text-gray-400 mt-1">Please select a fiscal year above to load shareholder records.</p>
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center text-gray-500">
                      <FaSpinner className="animate-spin mx-auto text-2xl text-blue-500 mb-3" />
                      Loading records...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center">
                      <FaUserTie className="mx-auto text-5xl text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400">No records found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{row.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.sh_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.reg_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.sif_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtMoney(row.paidup_capital)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">{fmtMoney(row.total_dividend)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {row.fiscal_year}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingItem({ ...row })}
                            className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar (matches reference image) */}
          {fiscalYear && !isLoading && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-white">
              {/* Left: rows per page + record count */}
              <div className="flex items-center gap-3">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">{filteredData.length} Records</span>
              </div>

              {/* Right: page buttons + jump + prev/next */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getPaginationRange(totalPages, currentPage).map((p, idx) =>
                    p === '...' ? (
                      <span key={`e-${idx}`} className="px-1.5 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-all ${
                          p === currentPage
                            ? 'bg-green-600 text-white shadow-sm'
                            : 'text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageJump}
                  onChange={(e) => setPageJump(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commitPageJump(pageJump)}
                  onBlur={() => { commitPageJump(pageJump); }}
                  className="w-14 h-8 px-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Delete Confirmation Modal ---------------- */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ animation: 'scaleIn 0.25s ease-out' }}>
            <div className="p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <FaExclamationTriangle className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Shareholder?</h3>
              <p className="text-sm text-gray-500">
                You are about to delete <span className="font-semibold text-gray-800">{deleteTarget.sh_name}</span>{' '}
                (<span className="font-mono text-xs">{deleteTarget.reg_no}</span>).
              </p>
              <p className="text-xs text-gray-400 mt-2">This will also remove the associated user account. This action cannot be undone.</p>
            </div>
            <div className="grid grid-cols-2 border-t border-gray-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="py-3.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Edit Modal (semi-transparent) ---------------- */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto border border-white/50"
            style={{ animation: 'scaleIn 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaEdit /> Edit Shareholder
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-white/80 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-8">
              {/* Personal Info */}
              <section>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-[2px] bg-blue-600 rounded-full"></span> Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Full Name" value={editingItem.sh_name} onChange={(v) => setEditingItem({ ...editingItem, sh_name: v })} />
                  <InputField label="Phone Number" value={editingItem.phone} onChange={(v) => setEditingItem({ ...editingItem, phone: v })} />
                  <InputField label="National ID" value={editingItem.national_id} onChange={(v) => setEditingItem({ ...editingItem, national_id: v })} />
                  <InputField label="Registration No" value={editingItem.reg_no} onChange={(v) => setEditingItem({ ...editingItem, reg_no: v })} />
                  <InputField label="SIF No" value={editingItem.sif_no} onChange={(v) => setEditingItem({ ...editingItem, sif_no: v })} />
                  <InputField label="Fiscal Year" value={editingItem.fiscal_year} onChange={(v) => setEditingItem({ ...editingItem, fiscal_year: v })} />
                </div>
              </section>

              {/* Financial Info */}
              <section>
                <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-[2px] bg-green-600 rounded-full"></span> Financial Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Paid-up Capital (ETB)" type="number" step="0.01" value={editingItem.paidup_capital} onChange={(v) => setEditingItem({ ...editingItem, paidup_capital: parseFloat(v) })} />
                  <InputField label="Dividend Declared (ETB)" type="number" step="0.01" value={editingItem.dividend_declared} onChange={(v) => setEditingItem({ ...editingItem, dividend_declared: parseFloat(v) })} />
                  <InputField label="Dividend B/F (ETB)" type="number" step="0.01" value={editingItem.dividend_bf} onChange={(v) => setEditingItem({ ...editingItem, dividend_bf: parseFloat(v) })} />
                  <InputField label="Total Dividend (ETB)" type="number" step="0.01" value={editingItem.total_dividend} onChange={(v) => setEditingItem({ ...editingItem, total_dividend: parseFloat(v) })} />
                </div>
              </section>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ------------------------- Modern Input Component ------------------------- */
function InputField({ label, value, onChange, type = 'text', step = null }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
      />
    </div>
  );
}