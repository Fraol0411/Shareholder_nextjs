'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FaRocket, FaSyncAlt, FaSearch, FaKey, FaUserSlash, FaCopy,
  FaExclamationTriangle, FaCheckCircle, FaClipboardList, FaShieldAlt,
  FaPauseCircle, FaPlayCircle, FaUndoAlt, FaTrashAlt,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Dialog, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { BusyChip, SkeletonRows } from '../../components/ui/loading';
import { useCampaignActions } from '../../hooks/useCampaignActions';
import { getStoredUser, getToken, isAdminRole } from '../../libs/auth';

const PAGE_SIZE = 25;

const STATUS_TONE = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300',
  verified: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  activated: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  expired: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  locked: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
};

const WINDOW_TONE = {
  open: STATUS_TONE.activated,
  scheduled: STATUS_TONE.pending,
  closed: STATUS_TONE.expired,
  disabled: STATUS_TONE.locked,
};

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : '—');

export default function ActivationDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [data, setData] = useState(null);
  // Starts true: the first render happens before the effect that fetches has run, and
  // an "isLoading" that begins false lets the empty states below announce "No campaign
  // yet" about data that is simply still on its way.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [campaignId, setCampaignId] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);

  const [issued, setIssued] = useState(null); // regenerate result
  const [issuedOpen, setIssuedOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { kind, ...context }
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { isActing, act, reissueCampaign, disableCampaign, enableCampaign, deleteCampaign } =
    useCampaignActions();
  const [isInvitationActing, setIsInvitationActing] = useState(false);
  const busy = isActing || isInvitationActing;

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdminRole(user?.role)) {
      router.replace(user ? '/home' : '/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (campaignId) params.set('campaignId', campaignId);
      if (status) params.set('status', status);
      if (q.trim()) params.set('q', q.trim());

      const res = await fetch(`/api/activation/dashboard?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'Failed to load dashboard');
      setData(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, status, q, offset]);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  const openConfirmation = (next) => {
    setConfirm(next);
    setConfirmOpen(true);
  };

  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed — select the text manually');
    }
  };

  // ---------------- per-invitation actions ----------------

  const runInvitationAction = async () => {
    if (!confirm) return;
    const { row, action } = confirm;
    setIsInvitationActing(true);
    try {
      const res = await fetch('/api/activation/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        // Shareholders of a disabled campaign get their new link in the live campaign
        body: JSON.stringify({
          userId: row.userId,
          action,
          campaignId: row.campaignStatus === 'live' ? row.campaignId : null,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'Failed to update invitation');

      setConfirmOpen(false);
      if (action === 'regenerate') {
        setIssued(payload);
        setIssuedOpen(true);
      } else {
        toast.success(payload.message);
      }
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsInvitationActing(false);
    }
  };

  // ---------------- campaign actions ----------------

  const runCampaignAction = async (typedValue) => {
    if (!confirm) return;
    const { action, campaign } = confirm;
    try {
      if (action === 'reissue') {
        const result = await act(() => reissueCampaign(campaign.id));
        toast.success(`Re-issued ${result.count} invitation(s)`, {
          description: 'Links and codes sent so far for this campaign no longer work. The new CSV has been downloaded.',
        });
      } else if (action === 'disable') {
        const payload = await act(() => disableCampaign(campaign.id));
        toast.success(payload.message);
      } else if (action === 'enable') {
        const payload = await act(() => enableCampaign(campaign.id));
        toast.success(payload.message);
      } else if (action === 'delete') {
        const payload = await act(() => deleteCampaign(campaign.id, typedValue));
        toast.success(payload.message);
      }
      setConfirmOpen(false);
      setOffset(0);
      await load();
    } catch (err) {
      toast.error(err.message);
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

  const totals = data?.totals || {};
  const gaps = data?.gaps || {};
  const matched = data?.matched || 0;
  const activationRate = totals.total ? Math.round(((totals.activated || 0) / totals.total) * 100) : 0;
  const liveCampaign = (data?.campaigns || []).find((row) => row.status === 'live') || null;
  // Nothing on screen yet, so the sections get placeholders instead of their empty
  // states. Once data exists, a refetch keeps the rows and only shows the busy chip.
  const firstLoad = isLoading && !data;

  const kpis = [
    { label: 'Invitations issued', value: totals.total, tone: 'text-slate-800 dark:text-slate-100' },
    { label: 'Awaiting activation', value: totals.pending, tone: 'text-slate-500 dark:text-slate-400' },
    { label: 'Identity verified', value: totals.verified, tone: 'text-sky-600 dark:text-sky-400' },
    { label: 'Activated', value: totals.activated, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Expired', value: totals.expired, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Locked (brute force)', value: totals.locked, tone: 'text-red-600 dark:text-red-400' },
  ];

  const rowIsInDisabledCampaign = confirm?.scope === 'invitation' && confirm.row.campaignStatus !== 'live';

  const confirmationProps = confirm
    ? confirm.scope === 'invitation'
      ? confirm.action === 'regenerate'
        ? {
            title: `Issue a new link for ${confirm.row.name}?`,
            description: 'Any outstanding invitation of this shareholder stops working immediately.',
            bullets: [
              'A brand-new link and 6-digit code are shown once — hand them to the shareholder right away.',
              'Only hashes are stored, so the pair can never be displayed again.',
              rowIsInDisabledCampaign
                ? `Campaign #${confirm.row.campaignId} is not live, so the invitation is issued into the live campaign instead.`
                : `The shareholder can use it during the window of campaign #${confirm.row.campaignId}.`,
            ],
            confirmLabel: 'Issue new link and code',
          }
        : {
            title: `Void the invitation of ${confirm.row.name}?`,
            description: 'The outstanding link and code of this shareholder are deleted and will no longer verify.',
            bullets: [
              'Shareholders who already verified or activated are never affected.',
              'A fresh invitation can still be issued afterwards with "New link".',
            ],
            tone: 'danger',
            confirmLabel: 'Void invitation',
          }
      : (() => {
          const c = confirm.campaign;
          if (confirm.action === 'disable') {
            return {
              title: `Disable campaign #${c.id}?`,
              description: 'Activation stops at once for every shareholder holding a link of this campaign.',
              bullets: [
                `Its ${c.pending} still-usable invitation(s) are rejected until the campaign is enabled again.`,
                'Nothing is deleted — enabling the campaign resumes the same invitations.',
                'The login page and the invitation page will show that activation is closed.',
              ],
              confirmLabel: 'Disable campaign',
            };
          }
          if (confirm.action === 'enable') {
            return {
              title: `Enable campaign #${c.id}?`,
              description: 'This campaign becomes the single live campaign and its links are accepted again.',
              bullets: [
                'Only one campaign can be live at a time — enabling fails while another campaign is live.',
                'Invitations that expired while it was disabled still need a re-issue.',
              ],
              confirmLabel: 'Enable campaign',
            };
          }
          if (confirm.action === 'reissue') {
            return {
              title: `Re-issue every invitation of campaign #${c.id}?`,
              description: `${gaps.inviteable_now ?? 0} shareholder(s) are invitable right now.`,
              bullets: [
                'Every link and code already sent for this campaign stops working immediately.',
                'Shareholders who have already activated are not invited again.',
                'A new CSV is downloaded for the SMS server — it is the only copy of the new links.',
              ],
              confirmLabel: 'Re-issue & download CSV',
            };
          }
          return {
            title: `Delete campaign #${c.id}?`,
            description: 'This removes the campaign and all of its invitation records permanently.',
            bullets: [
              `${c.invitations} invitation record(s) will be deleted, including their activation timestamps.`,
              `${c.activated} shareholder(s) who already activated keep their password and can still sign in.`,
              'There is no undo — disable the campaign instead if you only want to pause it.',
            ],
            tone: 'danger',
            requireText: c.id,
            confirmLabel: 'Delete campaign forever',
          };
        })()
    : {};

  return (
    <AppShell>
      <div className="py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
              <FaShieldAlt className="text-sky-600" />
              Activation Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {firstLoad
                ? 'Loading campaign state…'
                : liveCampaign
                  ? `Campaign #${liveCampaign.id} is live — invitations, delivery and per-shareholder activation status.`
                  : 'No campaign is live, so activation is closed. Start one from the Campaign Console.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <BusyChip show={isLoading && !firstLoad} className="self-center sm:self-auto" />
            <Button variant="outline" onClick={load} disabled={isLoading}>
              <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/codegeneration')}>
              <FaRocket />
              Campaign Console
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <FaExclamationTriangle className="shrink-0" />
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              {firstLoad ? (
                <div className="h-8 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-700" aria-hidden="true" />
              ) : (
                <p className={`text-2xl font-bold ${kpi.tone}`}>{kpi.value ?? 0}</p>
              )}
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Reachability / data gaps */}
        {(gaps.missing_phone > 0 || gaps.missing_national_id > 0) && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
            <p className="flex items-center gap-2 font-semibold">
              <FaExclamationTriangle /> {gaps.shareholders - gaps.eligible} shareholders cannot be invited yet
            </p>
            <p className="mt-1">
              Missing phone: <b>{gaps.missing_phone}</b> · Missing National ID/TIN: <b>{gaps.missing_national_id}</b>.
              Eligible for the next campaign: <b>{gaps.inviteable_now}</b> of <b>{gaps.shareholders}</b> shareholders.
            </p>
          </div>
        )}

        {/* Campaigns — one live at a time, the rest history */}
        <section className="mb-6 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-700">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <FaClipboardList className="text-sky-600" /> Campaigns
              <span className="text-xs font-normal text-slate-500">(one can be live at a time)</span>
            </h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/codegeneration')}>
              <FaRocket />
              {liveCampaign ? 'Open Campaign Console' : 'Start a campaign'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Invited</th>
                  <th className="px-4 py-3">Activated</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Started by</th>
                  <th className="px-4 py-3 text-right">Campaign actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {firstLoad && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4">
                      <SkeletonRows rows={3} className="space-y-2" itemClassName="border-slate-50 bg-slate-50/60 dark:bg-slate-900/40" />
                    </td>
                  </tr>
                )}
                {(data?.campaigns || []).map((row) => (
                  <tr key={row.id} className={row.status === 'live' ? 'bg-sky-50/50 dark:bg-sky-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-700/30'}>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.id}
                      {row.status === 'live' && (
                        <span className="ml-2 rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">live</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {fmtDate(row.starts_at)} <span className="text-slate-400">→</span> {fmtDate(row.ends_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${WINDOW_TONE[row.windowState] || WINDOW_TONE.closed}`}>
                        {row.windowState}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.invitations}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{row.activated}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.invitations ? (row.activated / row.invitations) * 100 : 0}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{row.created_by_name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {row.status === 'live' ? (
                          <button
                            onClick={() => openConfirmation({ scope: 'campaign', action: 'disable', campaign: row })}
                            disabled={busy}
                            title="Pause the campaign — links stop verifying, nothing is deleted"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/70 dark:text-amber-300 dark:hover:bg-amber-950/40"
                          >
                            <FaPauseCircle /> Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => openConfirmation({ scope: 'campaign', action: 'enable', campaign: row })}
                            disabled={busy}
                            title="Make this campaign the live one again"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/70 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                          >
                            <FaPlayCircle /> Enable
                          </button>
                        )}
                        <button
                          onClick={() => openConfirmation({ scope: 'campaign', action: 'reissue', campaign: row })}
                          disabled={busy || row.status !== 'live'}
                          title={row.status === 'live' ? 'Replace all outstanding links with new ones and download a fresh CSV' : 'Only the live campaign can be re-issued'}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <FaUndoAlt /> Re-issue
                        </button>
                        <button
                          onClick={() => openConfirmation({ scope: 'campaign', action: 'delete', campaign: row })}
                          disabled={busy}
                          title="Delete the campaign and its invitation records"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          <FaTrashAlt /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && (data?.campaigns || []).length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No campaign yet — start one to issue activation links.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Invitations */}
        <section className="overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Invitations <span className="ml-1 text-xs font-normal text-slate-500">({matched} matched)</span>
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-56">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setOffset(0); }}
                  placeholder="Name, phone, ID, reg no or user id"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All statuses</option>
                {['pending', 'verified', 'activated', 'expired', 'locked'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={campaignId}
                onChange={(e) => { setCampaignId(e.target.value); setOffset(0); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">All campaigns</option>
                {(data?.campaigns || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    Campaign #{c.id}{c.status === 'live' ? ' (live)' : ' (disabled)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Shareholder</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">National ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tries</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Activated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {firstLoad && (
                  <tr>
                    <td colSpan={9} className="px-4 py-4">
                      <SkeletonRows rows={5} className="space-y-2" itemClassName="border-slate-50 bg-slate-50/60 dark:bg-slate-900/40" />
                    </td>
                  </tr>
                )}
                {(data?.invitations || []).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
                      <p className="text-[11px] text-slate-400">
                        user #{row.userId} · campaign #{row.campaignId}
                        {row.campaignStatus !== 'live' && row.status !== 'activated' && (
                          <span className="ml-1 text-red-500">(campaign disabled)</span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.nationalId}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_TONE[row.status] || STATUS_TONE.pending}`}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{row.failedAttempts}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{fmtDate(row.expiresAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{fmtDate(row.consumedAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{fmtDate(row.passwordSetAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openConfirmation({ scope: 'invitation', action: 'regenerate', row })}
                          disabled={busy || row.status === 'activated' || (row.campaignStatus !== 'live' && !liveCampaign)}
                          title={
                            row.campaignStatus !== 'live' && !liveCampaign
                              ? 'No live campaign — start one before issuing links'
                              : 'Issue a new link and code'
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <FaKey /> New link
                        </button>
                        <button
                          onClick={() => openConfirmation({ scope: 'invitation', action: 'invalidate', row })}
                          disabled={busy || row.status !== 'pending'}
                          title="Void the outstanding invitation"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          <FaUserSlash /> Void
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && (data?.invitations || []).length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No invitations match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              {firstLoad
                ? 'Loading invitations…'
                : `Showing ${(data?.invitations || []).length} of ${matched} · overall activation rate ${activationRate}%`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((v) => Math.max(0, v - PAGE_SIZE))}
                disabled={offset === 0}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset((v) => v + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= matched}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <p className="mt-6 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          Links and codes are stored as hashes only, so an issued code can never be displayed again — use
          <b> New link</b> to issue a fresh pair and hand it to the shareholder immediately. Personal data is masked here.
        </p>

        {/* Per-shareholder and campaign confirmations */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(open) => { if (!open) setConfirmOpen(false); }}
          isBusy={busy}
          {...confirmationProps}
          onConfirm={confirm?.scope === 'campaign' ? runCampaignAction : runInvitationAction}
        />

        {/* Newly issued invitation */}
        <Dialog
          open={issuedOpen}
          onOpenChange={(open) => { if (!open) setIssuedOpen(false); }}
          title="New invitation issued"
          description={`Hand these to ${issued?.name || 'the shareholder'} now — they are shown once and cannot be recovered.`}
          icon={<FaCheckCircle className="h-5 w-5 text-emerald-500" />}
          footer={
            <DialogFooter>
              <Button onClick={() => setIssuedOpen(false)}>Done</Button>
            </DialogFooter>
          }
        >
          {issued && (
            <div className="space-y-3">
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Copy these now — only hashes are stored, so this is the only time they are visible.
              </p>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Activation link</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={issued.link} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200" onFocus={(e) => e.target.select()} />
                  <Button variant="outline" size="icon" onClick={() => copy(issued.link, 'Link')} aria-label="Copy link"><FaCopy /></Button>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Verification code</p>
                <div className="flex items-center gap-2">
                  <input readOnly value={issued.code} className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-lg font-bold tracking-widest dark:border-slate-600 dark:bg-slate-950 dark:text-white" onFocus={(e) => e.target.select()} />
                  <Button variant="outline" size="icon" onClick={() => copy(issued.code, 'Code')} aria-label="Copy code"><FaCopy /></Button>
                </div>
              </div>
              {issued.idReference && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reference</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={issued.idReference} className="w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider dark:border-slate-600 dark:bg-slate-950 dark:text-white" onFocus={(e) => e.target.select()} />
                    <Button variant="outline" size="icon" onClick={() => copy(issued.idReference, 'Reference')} aria-label="Copy reference"><FaCopy /></Button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    The last characters of this shareholder&apos;s National ID — quoted as{' '}
                    <span className="font-mono">Reference {issued.idReference}</span> in the invitation
                    SMS, so anyone holding several accounts on one phone can tell the messages apart.
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sent to: <span className="font-mono">{issued.phone}</span> · Valid until: {fmtDate(issued.expiresAt)}
              </p>
            </div>
          )}
        </Dialog>
      </div>
    </AppShell>
  );
}
