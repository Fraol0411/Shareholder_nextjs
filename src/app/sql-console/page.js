'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaDatabase, FaPlay, FaSpinner, FaExclamationTriangle, FaCheckCircle,
  FaHistory, FaTrash, FaClock, FaCode, FaTable, FaTimes, FaBolt,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';

const TEMPLATES = [
  { label: 'List users', sql: 'SELECT id, username, name, role, reg_no, phone, national_id FROM public.users ORDER BY id LIMIT 50' },
  { label: 'Count shareholders', sql: 'SELECT role, COUNT(*) AS total FROM public.users GROUP BY role' },
  { label: 'Dividends by year', sql: 'SELECT fiscal_year, COUNT(*) AS records, SUM(total_dividend) AS total_dividend FROM public.sh_dividend GROUP BY fiscal_year ORDER BY fiscal_year DESC' },
  { label: 'Recent dividends', sql: 'SELECT d.id, u.name, u.reg_no, d.fiscal_year, d.paidup_capital, d.total_dividend FROM public.sh_dividend d JOIN public.users u ON d.user_id = u.id ORDER BY d.id DESC LIMIT 50' },
  { label: 'Pending decisions', sql: "SELECT id, user_id, fiscal_year, status, submitted_at FROM public.sh_decision WHERE status = 'pending' ORDER BY submitted_at DESC LIMIT 50" },
];

export default function SqlConsolePage() {
  const router = useRouter();

  const [query, setQuery] = useState('SELECT id, username, name, role, reg_no, phone, national_id FROM public.users ORDER BY id LIMIT 50;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null); // { command, rowCount, durationMs, fields, rows }
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const textareaRef = useRef(null);

  /* ── Load history & verify admin role ── */
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.replace('/home');
      return;
    }
    setIsAdmin(true);

    try {
      const saved = JSON.parse(localStorage.getItem('sql_console_history') || '[]');
      setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, [router]);

  /* ── Persist history ── */
  const pushHistory = (sql, ok) => {
    setHistory((prev) => {
      const entry = { sql: sql.trim(), ok, at: new Date().toISOString() };
      // Deduplicate consecutive identical entries, keep the latest 25
      const next = prev.length && prev[0].sql === entry.sql ? prev : [entry, ...prev];
      const trimmed = next.slice(0, 25);
      localStorage.setItem('sql_console_history', JSON.stringify(trimmed));
      return trimmed;
    });
  };

  /* ── Execute ── */
  const executeQuery = async () => {
    const sql = query.trim();
    if (!sql) return setError('Please enter a SQL query.');

    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sql-console`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          [data.message, data.error, data.detail, data.hint].filter(Boolean).join(' — ') ||
            'Query failed.'
        );
      }

      setResult(data);
      pushHistory(sql, true);
    } catch (err) {
      setError(err.message || 'Query failed.');
      pushHistory(sql, false);
    } finally {
      setIsExecuting(false);
    }
  };

  /* ── Ctrl/Cmd + Enter shortcut ── */
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sql_console_history');
  };

  const formatCell = (value) => {
    if (value === null || value === undefined) return <span className="text-slate-400 italic">NULL</span>;
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'object') return JSON.stringify(value);
    // Dates from pg arrive as ISO strings
    return String(value);
  };

  if (isAdmin === null) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <FaSpinner className="animate-spin text-2xl text-brand-secondary" />
        </div>
      </AppShell>
    );
  }

  const columns = result?.fields?.length
    ? result.fields
    : result?.rows?.length
      ? Object.keys(result.rows[0])
      : [];

  return (
    <AppShell>
      <div className="py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-slate-800 dark:text-slate-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
                <FaDatabase />
              </span>
              SQL Console
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Run PostgreSQL queries directly against the Shareholder database. Admin access only.
            </p>
          </div>

          {/* Templates */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <FaBolt className="text-[10px]" /> Quick queries
            </span>
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => { setQuery(t.sql + ';'); textareaRef.current?.focus(); }}
                className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger notice */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <FaExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            Queries run <strong>live against the production database</strong> — UPDATE, INSERT, and DELETE
            statements take effect immediately and cannot be undone. Only one statement can be executed at a
            time (no semicolon-separated batches). Press <kbd className="rounded border border-amber-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-amber-700 dark:bg-slate-800">Ctrl</kbd>
            {' + '}
            <kbd className="rounded border border-amber-300 bg-white px-1.5 py-0.5 font-mono text-[10px] dark:border-amber-700 dark:bg-slate-800">Enter</kbd> to run.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ── Left: Editor + Results ── */}
          <div className="space-y-6 xl:col-span-2">
            {/* Editor */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <FaCode className="text-brand-secondary" /> Query Editor
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuery('')}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Clear
                  </button>
                  <button
                    onClick={executeQuery}
                    disabled={isExecuting || !query.trim()}
                    className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-hover active:scale-[0.98] disabled:opacity-50"
                  >
                    {isExecuting ? <FaSpinner className="animate-spin" /> : <FaPlay className="text-[10px]" />}
                    {isExecuting ? 'Executing…' : 'Execute'}
                  </button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="Write your PostgreSQL query here… e.g. SELECT * FROM public.users LIMIT 10;"
                className="h-56 w-full resize-y bg-white px-4 py-3.5 font-mono text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Error panel */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="mt-0.5 shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">Query failed</p>
                    <p className="mt-1 break-words font-mono text-xs leading-relaxed text-red-600 dark:text-red-400">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}

            {/* Success summary */}
            {result && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <span className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                  <FaCheckCircle /> Query executed successfully
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-xs text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {result.command}
                </span>
                <span className="text-xs text-emerald-700/80 dark:text-emerald-400">
                  {result.rowCount ?? 0} row{result.rowCount === 1 ? '' : 's'} affected
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-700/80 dark:text-emerald-400">
                  <FaClock className="text-[10px]" /> {result.durationMs} ms
                </span>
              </div>
            )}

            {/* Results table */}
            {result?.rows?.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <FaTable className="text-brand-secondary" /> Results
                  </span>
                  <span className="text-xs text-slate-400">
                    {result.rows.length} row{result.rows.length === 1 ? '' : 's'} · {columns.length} column{columns.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="max-h-[520px] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">#</th>
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.rows.map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-sky-50/60 dark:hover:bg-slate-800/60">
                          <td className="px-3 py-2 text-xs text-slate-300 dark:text-slate-600">{i + 1}</td>
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="max-w-[280px] truncate whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-200"
                              title={row[col] === null || row[col] === undefined ? 'NULL' : String(row[col])}
                            >
                              {formatCell(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: History ── */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900 xl:sticky xl:top-24 xl:self-start">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <FaHistory className="text-brand-secondary" /> Query History
              </span>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  title="Clear history"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                >
                  <FaTrash className="text-xs" />
                </button>
              )}
            </div>
            <div className="max-h-[560px] overflow-y-auto p-3">
              {history.length === 0 ? (
                <p className="px-2 py-8 text-center text-xs text-slate-400">
                  No queries yet. Executed queries will appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h, i) => (
                    <li key={i}>
                      <button
                        onClick={() => { setQuery(h.sql + ';'); textareaRef.current?.focus(); }}
                        className="group w-full rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-sky-800 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              h.ok ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span className="truncate font-mono text-[11px] leading-snug text-slate-600 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                            {h.sql}
                          </span>
                        </div>
                        <span className="mt-1 block pl-3.5 text-[10px] text-slate-400">
                          {new Date(h.at).toLocaleString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
