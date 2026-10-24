'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FaRocket, FaSyncAlt, FaInfoCircle, FaPauseCircle, FaPlayCircle,
  FaTrashAlt, FaUndoAlt, FaTachometerAlt, FaDownload,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Button } from '../../components/ui/button';
import { useCampaignActions } from '../../hooks/useCampaignActions';
import { getStoredUser, getToken, isAdminRole } from '../../libs/auth';

const STATE_PILL = {
  open: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  closed: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300',
  disabled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
};

const fmt = (value) => (value ? new Date(value).toLocaleString() : '—');

const toLocalInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** One campaign card, used for the live campaign and for a disabled last campaign. */
function CampaignPanel({ campaign, isActing, onAction }) {
  const live = campaign.status === 'live';

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Campaign #{campaign.id}</h2>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATE_PILL[campaign.windowState] || STATE_PILL.closed}`}>
            {campaign.windowState}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Started by {campaign.created_by_name || '—'} · {fmt(campaign.created_at)}
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Opens</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{fmt(campaign.starts_at)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Closes</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{fmt(campaign.ends_at)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invited</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {campaign.invitations} · <span className="text-emerald-600 dark:text-emerald-400">{campaign.activated} activated</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Usable now</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {campaign.outstanding} outstanding · {campaign.expired} expired
          </p>
        </div>
      </div>

      {!live && (
        <p className="mx-5 mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Campaign #{campaign.id} is disabled — its links and codes are rejected at verification. Enabling it again
          makes the same invitations work; invitations that expired in the meantime need a re-issue.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
        {live ? (
          <Button variant="outline" disabled={isActing} onClick={() => onAction({ type: 'disable', campaignId: campaign.id })}>
            <FaPauseCircle />
            Disable campaign
          </Button>
        ) : (
          <Button variant="outline" disabled={isActing} onClick={() => onAction({ type: 'enable', campaignId: campaign.id })}>
            <FaPlayCircle />
            Enable campaign
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={isActing || !live}
          title={live ? 'Replace all outstanding links with new ones' : 'Enable the campaign first'}
          onClick={() => onAction({ type: 'reissue', campaignId: campaign.id })}
        >
          <FaUndoAlt />
          Re-issue links
        </Button>
        <Button
          variant="outline"
          disabled={isActing || !campaign.invitations}
          title={
            campaign.invitations
              ? 'Download SMS CSV from stored invitation messages'
              : 'No invitations in this campaign yet'
          }
          onClick={() => onAction({ type: 'download', campaignId: campaign.id })}
        >
          <FaDownload />
          Download CSV
        </Button>
        <Button
          variant="destructive"
          disabled={isActing}
          onClick={() => onAction({
            type: 'delete',
            campaignId: campaign.id,
            invitations: campaign.invitations,
            activated: campaign.activated,
          })}
        >
          <FaTrashAlt />
          Delete campaign
        </Button>
      </div>
    </section>
  );
}

export default function ActivationCampaignConsolePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [campaign, setCampaign] = useState(null);        // the live campaign
  const [lastCampaign, setLastCampaign] = useState(null); // newest disabled campaign
  const [inviteable, setInviteable] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // a not-yet-read state must not show the create form
  const [loadError, setLoadError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { isActing, act, createCampaign, reissueCampaign, downloadCampaignCsv, disableCampaign, enableCampaign, deleteCampaign } =
    useCampaignActions();

  const defaultStart = new Date();
  const defaultEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const [startsAt, setStartsAt] = useState(toLocalInput(defaultStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(defaultEnd));

  // Guard: admin only
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
    setLoadError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/activation/campaign`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load the campaign');
      setCampaign(data.campaign);
      setLastCampaign(data.lastCampaign ?? null);
      setInviteable(data.inviteable ?? 0);
    } catch (err) {
      // An unreadable state must never look like "there is no campaign"
      setLoadError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  // Keep the last confirmation mounted while the dialog animates out (no flicker)
  const openConfirmation = (next) => {
    setConfirm(next);
    setConfirmOpen(true);
  };
  const closeConfirmation = () => setConfirmOpen(false);

  const runConfirm = async (typedValue) => {
    if (!confirm) return;
    try {
      if (confirm.type === 'create') {
        const result = await act(() => createCampaign({ startsAt: confirm.startsAt, endsAt: confirm.endsAt }));
        toast.success(`Campaign #${result.campaignId} created`, {
          description: `${result.count} personalized invitations generated — the CSV download has started. Upload it to your SMS server.`,
        });
      } else if (confirm.type === 'reissue') {
        const result = await act(() => reissueCampaign(confirm.campaignId, { deliverCsv: false }));
        toast.success(`Re-issued ${result.count} invitation(s)`, {
          description: 'Outstanding links and codes no longer work. Download CSV anytime to export messages.',
        });
      } else if (confirm.type === 'download') {
        const result = await act(() => downloadCampaignCsv(confirm.campaignId));
        toast.success('SMS CSV downloaded', {
          description: `${result.count} message(s) exported from stored invitation data.`,
        });
      } else if (confirm.type === 'disable') {
        const data = await act(() => disableCampaign(confirm.campaignId));
        toast.success(data.message);
      } else if (confirm.type === 'enable') {
        const data = await act(() => enableCampaign(confirm.campaignId));
        toast.success(data.message);
      } else if (confirm.type === 'delete') {
        const data = await act(() => deleteCampaign(confirm.campaignId, typedValue));
        toast.success(data.message);
      }
      closeConfirmation();
      await load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!authorized) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
        </div>
      </AppShell>
    );
  }

  const windowInvalid = new Date(endsAt) <= new Date(startsAt);

  const confirmProps = {
    create: () => ({
      title: 'Start the activation campaign?',
      description: `Window: ${confirm.startLabel} → ${confirm.endLabel}`,
      bullets: [
        `A unique activation link and a 6-digit code will be created for each of the ${confirm.count} invitable shareholders.`,
        'A CSV (phone number + personalized message) is downloaded for your SMS server — nothing is sent automatically.',
        'Links and codes are stored only as hashes, so this CSV is the only copy of them.',
      ],
      confirmLabel: 'Create campaign & download CSV',
    }),
    reissue: () => ({
      title: `Re-issue every invitation of campaign #${confirm.campaignId}?`,
      description: `${inviteable} shareholder(s) are invitable right now.`,
      bullets: [
        'Every link and code already sent for this campaign stops working immediately.',
        'Shareholders who have already activated are not invited again.',
        'This does not download a file — use Download CSV to export messages already on file.',
      ],
      confirmLabel: 'Re-issue invitations',
    }),
    download: () => ({
      title: `Download SMS CSV for campaign #${confirm.campaignId}?`,
      description: 'Exports phone numbers and personalized messages from invitations already stored for this campaign.',
      bullets: [
        'Re-issue is not required — this uses the SMS text saved when links were issued.',
        'Only shareholders who have not finished activation are included.',
      ],
      confirmLabel: 'Download CSV',
    }),
    disable: () => ({
      title: `Disable campaign #${confirm.campaignId}?`,
      description: 'Activation stops for every shareholder holding a link of this campaign.',
      bullets: [
        'Links and codes are rejected at verification until the campaign is enabled again.',
        'Nothing is deleted — enabling the campaign resumes the same invitations.',
        'The login page and the invitation page will show that activation is closed.',
      ],
      confirmLabel: 'Disable campaign',
    }),
    enable: () => ({
      title: `Enable campaign #${confirm.campaignId}?`,
      description: 'The campaign becomes the single live campaign and its links are accepted again.',
      bullets: [
        'Only one campaign can be live at a time — enabling fails if another campaign is currently live.',
        'Invitations that expired while it was disabled still need a re-issue.',
      ],
      confirmLabel: 'Enable campaign',
    }),
    delete: () => ({
      title: `Delete campaign #${confirm.campaignId}?`,
      description: 'This removes the campaign and all of its invitation records permanently.',
      bullets: [
        `${confirm.invitations} invitation record(s) will be deleted, including their activation timestamps.`,
        `${confirm.activated} shareholder(s) who already activated keep their password and can still sign in.`,
        'There is no undo — disable the campaign instead if you only want to pause it.',
      ],
      tone: 'danger',
      requireText: confirm.campaignId,
      confirmLabel: 'Delete campaign forever',
    }),
  };

  return (
    <AppShell>
      <div className="py-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
              <FaRocket className="text-brand-secondary" />
              Campaign Console
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              One activation campaign runs at a time. Each invited shareholder gets a unique link plus a 6-digit
              code, delivered by SMS.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" onClick={load} disabled={isLoading}>
              <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => router.push('/activation-dashboard')}>
              <FaTachometerAlt />
              Activation Dashboard
            </Button>
          </div>
        </div>

        {/* Live campaign — manage the one and only campaign */}
        {campaign && (
          <CampaignPanel campaign={campaign} isActing={isActing} onAction={openConfirmation} />
        )}

        {campaign ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Starting another campaign is blocked while campaign #{campaign.id} is live — only one campaign runs at a
            time. <b>Disable</b> it to pause activations (reversible, invitations kept), or <b>Delete</b> it to clear
            the campaign and its invitation records before creating a new one. Per-shareholder links are issued from
            the <b>Activation Dashboard</b>.
          </p>
        ) : loadError ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <h2 className="text-sm font-bold">The campaign state could not be read</h2>
            <p className="mt-1 text-xs">{loadError}</p>
            <p className="mt-2 text-xs">
              A campaign may still be live, so the form to start a new one stays hidden until this console can
              confirm that no campaign exists. Nothing has been changed.
            </p>
            <Button variant="outline" className="mt-4" onClick={load} disabled={isLoading}>
              <FaSyncAlt className={isLoading ? 'animate-spin' : ''} />
              Try again
            </Button>
          </section>
        ) : isLoading && !lastCampaign ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
          </div>
        ) : (
          <>
            {/* No live campaign: the most recent disabled one can be resumed or removed */}
            {lastCampaign && (
              <>
                <CampaignPanel campaign={lastCampaign} isActing={isActing} onAction={openConfirmation} />
                <p className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  No campaign is live right now, so activation is closed. Enable campaign #{lastCampaign.id} again, or
                  start a new one below — a new campaign becomes the single live campaign and #{lastCampaign.id} stays
                  in history as disabled.
                </p>
              </>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="px-5 py-6 sm:px-7">
                <div className="mb-5 flex items-center gap-2">
                  <FaInfoCircle className="text-brand-secondary" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {lastCampaign ? 'Start a new activation campaign' : 'Start the activation campaign'}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="ml-0.5 text-sm font-semibold text-slate-700 dark:text-white">Opens</label>
                    <input
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-0.5 text-sm font-semibold text-slate-700 dark:text-white">Closes</label>
                    <input
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <ul className="my-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary" />Covers shareholders whose phone number <b>and</b> National ID/TIN are on file — <b>{inviteable}</b> invitable right now.</li>
                  <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary" />Only <b>hashes</b> of the link token and code are stored — never the values themselves.</li>
                  <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary" />Links are single-use and expire after 72 hours or at campaign close, whichever is first.</li>
                  <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary" />SMS message text is stored with each invitation so you can download the CSV again without re-issuing.</li>
                </ul>

                <Button
                  disabled={windowInvalid}
                  onClick={() => {
                    if (windowInvalid) {
                      toast.error('The end time must be after the start time.');
                      return;
                    }
                    openConfirmation({
                      type: 'create',
                      startsAt: new Date(startsAt).toISOString(),
                      endsAt: new Date(endsAt).toISOString(),
                      startLabel: fmt(new Date(startsAt)),
                      endLabel: fmt(new Date(endsAt)),
                      count: inviteable,
                    });
                  }}
                  className="w-full sm:w-auto"
                >
                  <FaRocket />
                  Start Campaign &amp; Download Invitation CSV
                </Button>
              </div>
            </section>
          </>
        )}

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!open) closeConfirmation();
          }}
          isBusy={isActing}
          {...(confirm ? confirmProps[confirm.type]?.() || {} : {})}
          onConfirm={runConfirm}
        />
      </div>
    </AppShell>
  );
}
