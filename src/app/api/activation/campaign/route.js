import { NextResponse } from 'next/server';
import { getPool, requireAdmin } from '../../../../libs/serverAuth';
import {
  generateInvitations, countInvitableUsers, csvResponse,
} from '../../../../libs/activationCampaign';
import { saveCampaignCsv, loadCampaignCsv, deleteCampaignCsv } from '../../../../libs/campaignCsvStore';

const CAMPAIGN_SELECT = `
  SELECT c.id, c.starts_at, c.ends_at, c.status, c.disabled_at,
         c.created_by, c.created_at, c.updated_at,
         COALESCE(NULLIF(u.name, ''), u.username) AS created_by_name
  FROM public.activation_campaigns c
  LEFT JOIN public.users u ON u.id = c.created_by`;

function windowState(campaign) {
  if (campaign.status === 'disabled') return 'disabled';
  const now = Date.now();
  if (new Date(campaign.starts_at).getTime() > now) return 'scheduled';
  if (new Date(campaign.ends_at).getTime() < now) return 'closed';
  return 'open';
}

/** Campaign row + its invitation funnel. */
async function loadCampaign(pool, whereSql, params) {
  const result = await pool.query(
    `${CAMPAIGN_SELECT}\n ${whereSql}\n LIMIT 1`,
    params
  );
  const campaign = result.rows[0];
  if (!campaign) return null;

  const counts = await pool.query(
    `SELECT count(*)::int AS invitations,
            count(*) FILTER (WHERE password_set_at IS NOT NULL)::int AS activated,
            count(*) FILTER (WHERE consumed_at IS NOT NULL AND password_set_at IS NULL)::int AS verified,
            count(*) FILTER (WHERE consumed_at IS NULL AND password_set_at IS NULL AND expires_at > NOW())::int AS outstanding,
            count(*) FILTER (WHERE password_set_at IS NULL AND expires_at <= NOW())::int AS expired
     FROM public.activations WHERE campaign_id = $1`,
    [campaign.id]
  );

  return { ...campaign, ...counts.rows[0], windowState: windowState(campaign) };
}

function jsonError(message, status = 400) {
  return NextResponse.json({ message }, { status });
}

/**
 * GET /api/activation/campaign  (admin only)
 * The single live campaign (if any) with its funnel, the most recent disabled
 * campaign (so it can be re-enabled or deleted), and how many shareholders are
 * still invitable. Powers the Campaign Console.
 */
export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const pool = getPool();
    const campaign = await loadCampaign(pool, 'WHERE c.status = $1', ['live']);
    const lastCampaign = campaign
      ? null
      : await loadCampaign(pool, 'WHERE c.status = $1 ORDER BY c.id DESC', ['disabled']);

    const client = await pool.connect();
    let inviteable;
    try {
      inviteable = await countInvitableUsers(client, campaign?.id ?? null);
    } finally {
      client.release();
    }

    return NextResponse.json({ campaign, lastCampaign, inviteable });
  } catch (error) {
    console.error('Activation campaign GET error:', error);
    return jsonError('Failed to load campaign', 500);
  }
}

/**
 * POST /api/activation/campaign  (admin only)
 * Creates THE campaign (only one may exist live at a time), issues a unique
 * link + 6-digit code per invitable shareholder and streams the SMS-server CSV.
 *
 * Body: { startsAt: ISO string, endsAt: ISO string }
 * Response: text/csv with X-Campaign-Id / X-Invitation-Count headers.
 */
export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  let startsAt, endsAt;
  try {
    const body = await request.json();
    startsAt = new Date(body.startsAt);
    endsAt = new Date(body.endsAt);
  } catch {
    return jsonError('Invalid request body');
  }

  if (isNaN(startsAt) || isNaN(endsAt)) {
    return jsonError('Valid start and end times are required');
  }
  if (endsAt <= startsAt) {
    return jsonError('End time must be after start time');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;

  try {
    const pool = getPool();

    // One campaign at a time — refuse before touching anything
    const existing = await loadCampaign(pool, 'WHERE c.status = $1', ['live']);
    if (existing) {
      return jsonError(
        `Campaign #${existing.id} is already set up. Disable or delete it before creating a new one.`,
        409
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const campaignResult = await client.query(
        `INSERT INTO public.activation_campaigns (starts_at, ends_at, status, created_by)
         VALUES ($1, $2, 'live', $3)
         RETURNING id`,
        [startsAt, endsAt, auth.decoded.id]
      );
      const campaignId = campaignResult.rows[0].id;

      const { count, csv } = await generateInvitations(client, {
        campaignId, endsAt, baseUrl,
      });

      if (count === 0) {
        // Nothing to send — do not leave an empty campaign behind
        await client.query('ROLLBACK');
        return jsonError('No invitable shareholders found — every shareholder is missing a phone number or a National ID/TIN.');
      }

      await client.query('COMMIT');
      // Cache the file server-side so it can be re-downloaded later without a
      // fresh re-issue. Raw links/codes never go into PostgreSQL.
      await saveCampaignCsv(campaignId, csv);
      return csvResponse(csv, campaignId, {
        'X-Campaign-Id': String(campaignId),
        'X-Invitation-Count': String(count),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Activation campaign create error:', error);
    // The partial unique index also guards against a concurrent create
    if (error.code === '23505') {
      return jsonError('Another campaign was created at the same time. Only one campaign can run at a time.', 409);
    }
    return jsonError('Failed to start activation campaign', 500);
  }
}

/**
 * PATCH /api/activation/campaign  (admin only)
 * Body: { campaignId, action: 'disable' | 'enable' | 'reissue' | 'download' }
 *
 * - disable: pause the campaign — every link/code of the campaign stops working
 *   immediately, without deleting anything. Reversible with 'enable'.
 * - enable: make a disabled campaign live again (fails if another campaign is
 *   already live — only one at a time).
 * - reissue: replace outstanding invitations with brand-new links/codes and save the
 *   generated CSV server-side. With deliverCsv: true (default) the response is text/csv;
 *   with deliverCsv: false the response is JSON (the file stays available to download).
 * - download: stream the SMS CSV saved on disk when this campaign was last issued —
 *   independent of re-issue and requiring no schema change.
 */
export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  let campaignId, action, deliverCsv;
  try {
    const body = await request.json();
    campaignId = Number(body.campaignId);
    action = body.action;
    deliverCsv = body.deliverCsv !== false;
  } catch {
    return jsonError('Invalid request body');
  }

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return jsonError('A valid campaignId is required');
  }
  if (!['disable', 'enable', 'reissue', 'download'].includes(action)) {
    return jsonError('action must be disable, enable, reissue or download');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;

  try {
    const pool = getPool();
    const target = await loadCampaign(pool, 'WHERE c.id = $1', [campaignId]);
    if (!target) return jsonError('Campaign not found', 404);

    if (action === 'disable') {
      if (target.status === 'disabled') return jsonError('This campaign is already disabled');
      const updated = await pool.query(
        `UPDATE public.activation_campaigns
         SET status = 'disabled', disabled_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND status = 'live'
         RETURNING id, status, disabled_at`,
        [campaignId]
      );
      if (updated.rows.length === 0) return jsonError('Campaign is no longer live — refresh and try again', 409);
      return NextResponse.json({
        message: `Campaign #${campaignId} disabled. Its ${target.outstanding} outstanding invitation(s) stop working until it is enabled again.`,
        campaign: { ...target, ...updated.rows[0], status: 'disabled', windowState: 'disabled' },
      });
    }

    if (action === 'enable') {
      if (target.status === 'live') return jsonError('This campaign is already live');
      const blocking = await pool.query(
        `SELECT id FROM public.activation_campaigns WHERE status = 'live' LIMIT 1`
      );
      if (blocking.rows.length > 0) {
        return jsonError(
          `Campaign #${blocking.rows[0].id} is the live campaign. Only one campaign can run at a time — disable or delete it first.`,
          409
        );
      }
      const updated = await pool.query(
        `UPDATE public.activation_campaigns
         SET status = 'live', disabled_at = NULL, updated_at = NOW()
         WHERE id = $1 AND status = 'disabled'
         RETURNING id, status, disabled_at`,
        [campaignId]
      );
      if (updated.rows.length === 0) return jsonError('Campaign is no longer disabled — refresh and try again', 409);

      const reloaded = await loadCampaign(pool, 'WHERE c.id = $1', [campaignId]);
      const note = reloaded.windowState === 'closed'
        ? 'Warning: the activation window of this campaign has already passed, so links still will not verify until it ends later than now.'
        : '';
      return NextResponse.json({ message: `Campaign #${campaignId} is live again.${note ? ` ${note}` : ''}`, campaign: reloaded });
    }

    if (action === 'download') {
      // Serve the CSV cached on disk when this campaign's links were last issued.
      // Schema-free: raw links/codes never live in PostgreSQL, so the generated
      // file is kept server-side for re-download without a fresh re-issue.
      const stored = await loadCampaignCsv(campaignId);
      if (!stored || stored.count === 0) {
        return jsonError(
          'No saved SMS CSV for this campaign yet. Create or re-issue invitations once to generate the file, then download it anytime.',
          404
        );
      }

      return csvResponse(stored.csv, campaignId, {
        'X-Campaign-Id': String(campaignId),
        'X-Invitation-Count': String(stored.count),
      });
    }

    // ---------- reissue ----------
    if (target.status !== 'live') {
      return jsonError('Only the live campaign can be re-issued. Enable it first.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { count, csv } = await generateInvitations(client, {
        campaignId, endsAt: target.ends_at, baseUrl,
      });
      await client.query('COMMIT');

      if (count === 0) return jsonError('No shareholder is invitable in this campaign right now.');

      // Keep the freshly generated file on disk so Download CSV works without
      // re-running the issuance.
      await saveCampaignCsv(campaignId, csv);

      if (deliverCsv) {
        return csvResponse(csv, campaignId, {
          'X-Campaign-Id': String(campaignId),
          'X-Invitation-Count': String(count),
        });
      }

      return NextResponse.json({
        message: `Re-issued ${count} invitation(s). Links and codes sent so far for this campaign no longer work.`,
        campaignId,
        count,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Activation campaign patch error:', error);
    return jsonError('Failed to update campaign', 500);
  }
}

/**
 * DELETE /api/activation/campaign  (admin only)
 * Body: { campaignId, confirm } — `confirm` must equal the campaign id (typed by
 * the admin), so a stray click can never destroy a campaign.
 *
 * Removes the campaign and, by cascade, every invitation row of that campaign
 * (including activation timestamps). Shareholder accounts and their passwords
 * are untouched — an activated shareholder stays activated.
 */
export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  let campaignId, confirm;
  try {
    const body = await request.json();
    campaignId = Number(body.campaignId);
    confirm = body.confirm;
  } catch {
    return jsonError('Invalid request body');
  }

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return jsonError('A valid campaignId is required');
  }
  if (String(confirm).trim() !== String(campaignId)) {
    return jsonError(`Type the campaign number ${campaignId} to confirm deletion`, 400);
  }

  try {
    const pool = getPool();
    const target = await loadCampaign(pool, 'WHERE c.id = $1', [campaignId]);
    if (!target) return jsonError('Campaign not found', 404);

    const deleted = await pool.query(
      `DELETE FROM public.activation_campaigns WHERE id = $1 RETURNING id`,
      [campaignId]
    );
    if (deleted.rows.length === 0) return jsonError('Campaign was already deleted — refresh the list', 409);

    await deleteCampaignCsv(campaignId);

    return NextResponse.json({
      message: `Campaign #${campaignId} deleted with its ${target.invitations} invitation record(s). Activated shareholder accounts were not affected.`,
      campaignId,
      invitations: target.invitations,
    });
  } catch (error) {
    console.error('Activation campaign delete error:', error);
    return jsonError('Failed to delete campaign', 500);
  }
}
