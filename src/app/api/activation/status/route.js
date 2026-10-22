import { NextResponse } from 'next/server';
import { getPool } from '../../../../libs/serverAuth';
import { sha256Hex } from '../../../../libs/activation';

/**
 * GET /api/activation/status  (public, no PII)
 * Describes the campaign window shareholders are allowed to activate in, so the
 * login pages can show "activation opens on / is open until" and the invitation
 * page can refuse before asking for anything.
 *
 * Only ONE campaign can be live at a time; when the campaign is disabled (or no
 * campaign exists) activation is closed.
 *
 * Optional `?token=<activation token>`: the invitation page also asks whether THIS
 * link has already been used, so a shareholder who activated earlier is told so
 * instead of being pushed through a form that can never succeed. The answer is a
 * state word only — no name, phone, ID, e-mail or account details are returned,
 * and the token itself is an unguessable 256-bit value that only the invited
 * shareholder (and Awash) ever has.
 */
export async function GET(request) {
  const rawToken = new URL(request.url).searchParams.get('token') || '';
  const linkToken = /^[0-9a-fA-F]{64}$/.test(rawToken) ? sha256Hex(rawToken.trim()) : null;

  try {
    const pool = getPool();

    // Link state first: it is meaningful even when the campaign window moved on.
    let link = null;
    if (linkToken) {
      const linkRes = await pool.query(
        `SELECT a.password_set_at IS NOT NULL AS activated,
                a.consumed_at IS NOT NULL AS verified,
                a.expires_at,
                c.status AS campaign_status
         FROM public.activations a
         JOIN public.activation_campaigns c ON c.id = a.campaign_id
         WHERE a.token_hash = $1
         LIMIT 1`,
        [linkToken]
      );
      const row = linkRes.rows[0];
      if (row) {
        const usable =
          row.campaign_status === 'live' && new Date(row.expires_at).getTime() > Date.now();
        link = {
          state: row.activated ? 'activated' : row.verified ? 'verified' : usable ? 'usable' : 'unusable',
          expiresAt: row.expires_at,
        };
      }
    }

    const result = await pool.query(
      `SELECT id, starts_at, ends_at, status
       FROM public.activation_campaigns
       ORDER BY (status = 'live') DESC, id DESC
       LIMIT 1`
    );

    const campaign = result.rows[0];
    if (!campaign) {
      return NextResponse.json({ exists: false, disabled: false, link });
    }

    const disabled = campaign.status === 'disabled';
    const now = Date.now();
    const startsAt = new Date(campaign.starts_at).getTime();
    const endsAt = new Date(campaign.ends_at).getTime();
    const open = !disabled && now >= startsAt && now <= endsAt;

    return NextResponse.json({
      exists: !disabled,
      campaignId: campaign.id,
      disabled,
      startsAt: campaign.starts_at,
      endsAt: campaign.ends_at,
      beforeStart: !disabled && now < startsAt,
      active: open,
      ended: !disabled && now > endsAt,
      link,
    });
  } catch (error) {
    // Table/column may not exist yet (migration not run) — degrade gracefully.
    console.error('Activation status error:', error);
    return NextResponse.json({ exists: false, disabled: false, link: null });
  }
}
