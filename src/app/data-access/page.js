'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FaComments,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaSyncAlt,
  FaUserSlash,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { StatusNotice } from '../../components/ui/status-notice';
import { Button } from '../../components/ui/button';
import { Toggle, ToggleState } from '../../components/ui/toggle';
import { getStoredUser, getToken, isAdminRole } from '../../libs/auth';

const MAX_NOTE_LENGTH = 300;
const SEARCH_DEBOUNCE_MS = 350;

// Shown to a shareholder when no custom message is saved — mirrors
// requireDividendDataAccess() in libs/serverAuth.js so the preview is truthful.
const DEFAULT_NOTE = 'Dividend data viewing is temporarily closed. Please check back later.';

const fmtDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

/**
 * The API answers in tokens and status codes; an administrator should not have to
 * read those. Anything unrecognised falls back to the server's own wording.
 */
function humanizeStatus(status, serverMessage) {
  if (status === 401) return 'Your sign-in has expired. Sign in again to change these settings.';
  if (status === 403) return 'This console is for administrators. Sign in with an admin account to make changes.';
  return serverMessage || 'We could not reach the access settings. Please try again.';
}

/** Initial letter tile, the way iOS rows lead with an avatar. */
function RowAvatar({ name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-secondary-soft text-xs font-bold text-brand-primary dark:bg-slate-700 dark:text-brand-secondary">
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

// users.status in plain words, so the list never shows a raw database value. An
// unknown status falls back to a humanised version of it rather than the enum.
const ACCOUNT_STATE = {
  active: null,
  disabled: 'Blocked here',
  locked: 'Locked after failed sign-ins',
  pending: 'Waiting to activate',
  no_link: 'Activation link expired',
};

function accountState(status) {
  if (!status || status === 'active') return null;
  if (ACCOUNT_STATE[status] !== undefined) return ACCOUNT_STATE[status];
  return String(status).replace(/_/g, ' ');
}

/**
 * What one shareholder can do at this moment. The master switch comes first:
 * while it is closed, saying “Allowed” would be a lie, so the row says the person
 * is hidden by the switch instead.
 */
function accessBadge(row, enabled) {
  if (!enabled) {
    return row.blocked
      ? { text: 'Hidden — also blocked here', tone: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' }
      : { text: 'Hidden while closed', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' };
  }
  return row.blocked
    ? { text: 'Blocked', tone: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' }
    : { text: 'Can view', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' };
}

/**
 * Consequences of the current switch position, in operational terms: who can see
 * what right now, and what happens to the individually blocked accounts.
 */
function AccessSummary({ enabled, shareholderCount, blockedCount, lastChangedBy, lastChangedAt }) {
  const blockedPhrase =
    blockedCount === 1
      ? '1 account is blocked on its own'
      : `${blockedCount} accounts are blocked on their own`;

  const lines = enabled
    ? [
        'Shareholders can open their dividend statement, fill the declaration form and check the decisions they submitted.',
        blockedCount
          ? `${blockedPhrase} — they stay hidden until you restore them, and are left out of the next invitation round.`
          : `Nobody is blocked individually — all ${shareholderCount.toLocaleString()} shareholder accounts have access.`,
        'Changes here take effect the moment a shareholder next opens a page — nobody has to sign out.',
      ]
    : [
        'No shareholder can see any dividend amount. They get a “Not available right now” notice in place of the statement, the declaration form and their decisions.',
        'You and your staff keep full access, so a statement can still be checked from inside the portal.',
        blockedCount
          ? `${blockedPhrase} — they will still be hidden after you reopen.`
          : 'Nothing is blocked on an individual account, so reopening restores every shareholder at once.',
      ];

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-700 dark:bg-slate-900/30">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {enabled ? 'What shareholders can do right now' : 'What shareholders see right now'}
      </p>
      <ul className="space-y-1.5">
        {lines.map((line) => (
          <li
            key={line}
            className="flex items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                enabled ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              aria-hidden="true"
            />
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
        {lastChangedAt
          ? `${enabled ? 'Reopened' : 'Closed'} by ${lastChangedBy || '—'} · ${fmtDateTime(lastChangedAt)}`
          : 'Nobody has moved this switch yet'}
      </p>
    </div>
  );
}

export default function DataAccessPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  // A failed request must never be shown as “nobody matched the search”, and an
  // expired sign-in is its own case: the admin can fix it by logging in again.
  const [listFailed, setListFailed] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListFetching, setIsListFetching] = useState(false);

  const [query, setQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  // The message as it is on the server, so a background refresh never overwrites
  // a message the admin is still typing.
  const noteOnServer = useRef('');
  // Only the newest search response may paint, otherwise fast typing can show
  // results of an older term.
  const requestId = useRef(0);

  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const busy = isSavingGlobal || isSavingNote || savingUserId !== null;

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdminRole(user?.role)) {
      router.replace(user ? '/home' : '/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  // One call serves everything on this page: the switch, its message and the rows.
  const load = useCallback(
    async ({ silent = false } = {}) => {
      const mine = ++requestId.current;
      if (!silent) setIsLoading(true);
      try {
        const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
        const res = await fetch(`/api/admin/data-access${params}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.status === 401) {
          if (mine !== requestId.current) return;
          setError(humanizeStatus(401));
          setIsSessionExpired(true);
          setListFailed(true);
          return;
        }
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(humanizeStatus(res.status, payload.message));
        if (mine !== requestId.current) return;

        const previousNote = noteOnServer.current;
        noteOnServer.current = payload.note || '';
        setNoteDraft((draft) => (draft === previousNote ? payload.note || '' : draft));

        setState((prev) => (prev && silent ? { ...prev, ...payload } : payload));
        setError('');
        setListFailed(false);
        setIsSessionExpired(false);
      } catch (err) {
        if (mine === requestId.current) {
          setError(err.message);
          setListFailed(true);
        }
      } finally {
        if (mine === requestId.current) setIsLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (!authorized) return undefined;
    setIsListFetching(true);
    const timer = setTimeout(() => {
      load().finally(() => setIsListFetching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [authorized, load]);

  // Someone else (or another tab) may have moved a switch in the meantime, so
  // re-read the truth whenever this tab is looked at again.
  useEffect(() => {
    if (!authorized) return undefined;
    const resync = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, [authorized, load]);

  /** PUT the master switch only — the message is saved on its own. */
  const setGlobalEnabled = async (enabled) => {
    const previous = state?.enabled;
    setState((prev) => (prev ? { ...prev, enabled } : prev));
    setIsSavingGlobal(true);
    try {
      const res = await fetch('/api/admin/data-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ enabled }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'We could not save the switch. Please try again.');
      // One careless flip must never leave the whole portal shut by accident.
      toast.success(payload.message, {
        duration: 8000,
        action: { label: 'Undo', onClick: () => setGlobalEnabled(previous) },
      });
      await load({ silent: true });
    } catch (err) {
      setState((prev) => (prev ? { ...prev, enabled: previous } : prev));
      toast.error(err.message);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const saveNote = async () => {
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/admin/data-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ enabled: !!state?.enabled, note: noteDraft }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'We could not save the message. Please try again.');
      toast.success('Message saved — shareholders see it right away.');
      await load({ silent: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  /** Flip one shareholder, then put the row back if the server disagrees. */
  const setRowBlocked = async (row, blocked) => {
    if (!row) return;
    const patch = (isBlocked, status, delta) =>
      setState((prev) =>
        prev
          ? {
              ...prev,
              stats: { ...prev.stats, disabled: Math.max(0, (prev.stats?.disabled ?? 0) + delta) },
              shareholders: {
                ...prev.shareholders,
                rows: (prev.shareholders?.rows || []).map((r) =>
                  r.userId === row.userId ? { ...r, blocked: isBlocked, status } : r
                ),
              },
            }
          : prev
      );

    patch(blocked, blocked ? 'disabled' : 'active', blocked ? 1 : -1);
    setSavingUserId(row.userId);
    try {
      const res = await fetch('/api/admin/data-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId: row.userId, action: blocked ? 'disable' : 'enable' }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'We could not update that shareholder. Please try again.');

      toast.success(blocked ? `${row.name} can no longer view dividend data.` : `${row.name} can view dividend data again.`, {
        action: { label: 'Undo', onClick: () => setRowBlocked(row, !blocked) },
      });
      // Re-read the list so a restored shareholder leaves the “Blocked” view.
      await load({ silent: true });
    } catch (err) {
      patch(row.blocked, row.status, row.blocked ? -1 : 1);
      toast.error(err.message);
    } finally {
      setSavingUserId(null);
    }
  };

  if (!authorized) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-400" />
        </div>
      </AppShell>
    );
  }

  const enabled = !!state?.enabled;
  const blockedCount = state?.stats?.disabled ?? 0;
  const shareholderCount = state?.stats?.shareholders ?? 0;
  const rows = state?.shareholders?.rows || [];
  const rowTotal = state?.shareholders?.total ?? 0;
  const rowLimit = state?.shareholders?.limit ?? 25;
  const searching = query.trim().length > 0;
  const shownNote = noteDraft.trim() || DEFAULT_NOTE;
  const noteDirty = noteDraft !== (state?.note ?? '');

  return (
    <AppShell>
      <div className="py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
              {enabled ? (
                <FaEye className="text-emerald-600" />
              ) : (
                <FaEyeSlash className="text-red-600" />
              )}
              Shareholder Data Access
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Turn this off and every shareholder instantly loses sight of their dividend figures — nobody has to sign
              out first. Staff and admin always keep access.
            </p>
          </div>
          <Button variant="outline" onClick={() => load()} disabled={isLoading || busy}>
            <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {error && (
          <StatusNotice
            tone={isSessionExpired ? 'notice' : 'error'}
            title={isSessionExpired ? 'Sign-in expired' : undefined}
            message={error}
            className="mb-4"
          >
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => (isSessionExpired ? router.push('/login') : load())}
            >
              {isSessionExpired ? 'Sign in again' : 'Try again'}
            </Button>
          </StatusNotice>
        )}

        {/* ── Master switch ── */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                enabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
              }`}
              aria-hidden="true"
            >
              {enabled ? <FaEye /> : <FaEyeSlash />}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                Shareholders can view dividend data
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                One switch covers all {shareholderCount.toLocaleString()} shareholder accounts. Signing in, activation
                links and campaigns keep working either way.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <ToggleState tone={enabled ? 'positive' : 'negative'}>{enabled ? 'Open' : 'Closed'}</ToggleState>
              <Toggle
                size="lg"
                checked={enabled}
                pending={isSavingGlobal}
                disabled={!state || busy}
                onCheckedChange={setGlobalEnabled}
                aria-label="Shareholders can view dividend data"
              />
            </div>
          </div>

          <AccessSummary
            enabled={enabled}
            shareholderCount={shareholderCount}
            blockedCount={blockedCount}
            lastChangedBy={state?.lastChangedBy}
            lastChangedAt={state?.lastChangedAt}
          />
        </section>

        {/* ── Message shareholders see ── */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-700">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FaComments className="text-sky-600" />
                Message shareholders see
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {enabled
                  ? 'Kept ready for the next closure — shareholders cannot see it while access is open.'
                  : 'This is what shareholders are reading instead of their statement right now.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {noteDirty && !isSavingNote && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Not saved yet</span>
              )}
              <Button variant="secondary" size="sm" disabled={!noteDirty || !state || busy} onClick={saveNote}>
                {isSavingNote ? 'Saving…' : 'Save message'}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="access-note"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Your message
              </label>
              <textarea
                id="access-note"
                value={noteDraft}
                rows={4}
                disabled={!state}
                onChange={(e) => setNoteDraft(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                placeholder="e.g. Statements reopen once the General Meeting resolves the dividend payout."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <p className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>Leave it empty and shareholders are shown a neutral “temporarily closed” line.</span>
                <span className="tabular-nums">
                  {noteDraft.length}/{MAX_NOTE_LENGTH}
                </span>
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {enabled ? 'Preview' : 'Exactly what they see right now'}
              </p>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-lg bg-amber-100 p-1.5 dark:bg-amber-900/60">
                    <FaExclamationTriangle className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Not available right now
                    </p>
                    <p className="mt-0.5 break-words text-xs text-amber-700 dark:text-amber-300">{shownNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Per-shareholder switches ── */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FaUserSlash className="text-slate-400" />
                Individual shareholders
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {listFailed ? 'Not loaded' : searching ? `${rowTotal} found` : `${blockedCount} blocked`}
                </span>
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {enabled
                  ? 'Blocking someone here hides their data even while the main switch is open.'
                  : 'Access is closed for everyone at the moment. These settings decide who is let back in when you reopen.'}
              </p>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, reg no, phone or ID"
                aria-label="Search shareholders"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((row) => {
              const isSaving = savingUserId === row.userId;
              const badge = accessBadge(row, enabled);
              return (
                <li key={row.userId} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                  <RowAvatar name={row.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
                    <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                      {[row.regNo || 'No registration number yet', row.phone, accountState(row.status)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.tone}`}
                  >
                    {badge.text}
                  </span>
                  <Toggle
                    checked={!row.blocked}
                    pending={isSaving}
                    disabled={!state}
                    onCheckedChange={(allow) => setRowBlocked(row, !allow)}
                    size="md"
                    aria-label={`Let ${row.name} view dividend data`}
                  />
                </li>
              );
            })}

            {!isLoading && !isListFetching && rows.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {listFailed ? (
                  <>
                    The shareholder list could not be loaded, so this may not be the full picture.
                    <Button size="sm" variant="secondary" className="ml-2" onClick={() => load()}>
                      Try again
                    </Button>
                  </>
                ) : searching ? (
                  'No shareholder matches that search.'
                ) : (
                  'No shareholder is blocked. Search for someone to block or restore them.'
                )}
              </li>
            )}
            {(isLoading || isListFetching) && rows.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-400">Loading…</li>
            )}
          </ul>

          {rowTotal > rows.length && (
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
              Showing the first {rowLimit} of {rowTotal} — refine the search to narrow it down.
            </p>
          )}
        </section>

        <p className="mt-6 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Blocking a shareholder only hides their dividend data — the account and password stay untouched, so they can
          still sign in and will read the message above. Blocked accounts are also left out of the next invitation
          round.
        </p>
      </div>
    </AppShell>
  );
}
