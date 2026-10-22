import { NextResponse } from 'next/server';
import { getPool, requireAdmin } from '../../../../libs/serverAuth';

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '—';
  return `${digits.slice(0, 3)}••••${digits.slice(-3)}`;
}

function maskId(value) {
  const str = String(value || '').trim();
  if (str.length < 4) return '—';
  return `${str.slice(0, 2)}${'•'.repeat(Math.max(0, str.length - 4))}${str.slice(-2)}`;
}

const STATUS_CASE = `
  CASE
    WHEN a.password_set_at IS NOT NULL THEN 'activated'
    WHEN a.consumed_at IS NOT NULL THEN 'verified'
    WHEN a.locked_until > NOW() THEN 'locked'
    WHEN a.expires_at <= NOW() THEN 'expired'
    ELSE 'pending'
  END`;

/**
 * GET /api/activation/dashboard  (admin only)
 * Aggregated view of the activation programme: campaign windows, per-campaign
 * funnel counts, a paged/filtered invitation list and the identity data gaps
 * that keep shareholders out of a campaign.
 *
 * Query: ?campaignId=&status=&q=&limit=&offset=
 * Personal data is masked; tokens/codes are never returned (only hashes exist).
 */
export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const campaignId = Number(searchParams.get('campaignId')) || null;
  const status = ['pending', 'verified', 'activated', 'expired', 'locked'].includes(searchParams.get('status'))
    ? searchParams.get('status')
    : null;
  const q = (searchParams.get('q') || '').trim().slice(0, 60);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

  try {
    const pool = getPool();

    // 1) Overall funnel across every invitation
    const totals = await pool.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE ${STATUS_CASE} = 'pending')::int AS pending,
         count(*) FILTER (WHERE ${STATUS_CASE} = 'verified')::int AS verified,
         count(*) FILTER (WHERE ${STATUS_CASE} = 'activated')::int AS activated,
         count(*) FILTER (WHERE ${STATUS_CASE} = 'expired')::int AS expired,
         count(*) FILTER (WHERE ${STATUS_CASE} = 'locked')::int AS locked,
         count(*) FILTER (WHERE a.failed_attempts > 0)::int AS with_failed_attempts
       FROM public.activations a`
    );

    // 2) Campaigns with their own funnel (one live at a time, the rest history)
    const campaigns = await pool.query(
      `SELECT c.id, c.starts_at, c.ends_at, c.status, c.disabled_at, c.created_at, c.updated_at,
              COALESCE(NULLIF(u.name, ''), u.username) AS created_by_name,
              count(a.id)::int AS invitations,
              count(a.id) FILTER (WHERE a.password_set_at IS NOT NULL)::int AS activated,
              count(a.id) FILTER (WHERE a.consumed_at IS NOT NULL AND a.password_set_at IS NULL)::int AS verified,
              count(a.id) FILTER (WHERE a.consumed_at IS NULL AND a.password_set_at IS NULL AND a.expires_at > NOW())::int AS pending,
              count(a.id) FILTER (WHERE a.password_set_at IS NULL AND a.expires_at <= NOW())::int AS expired
       FROM public.activation_campaigns c
       LEFT JOIN public.activations a ON a.campaign_id = c.id
       LEFT JOIN public.users u ON u.id = c.created_by
       GROUP BY c.id, c.starts_at, c.ends_at, c.status, c.disabled_at, c.created_at, c.updated_at, u.name, u.username
       ORDER BY c.status = 'live' DESC, c.id DESC
       LIMIT 20`
    );

    // 3) Reachability / data-quality picture for the next campaign
    const gaps = await pool.query(
      `SELECT
         count(*) FILTER (WHERE role IN ('user','user2'))::int AS shareholders,
         count(*) FILTER (WHERE role IN ('user','user2') AND phone IS NOT NULL AND phone <> ''
                          AND national_id IS NOT NULL AND national_id <> '')::int AS eligible,
         count(*) FILTER (WHERE role IN ('user','user2') AND (phone IS NULL OR phone = ''))::int AS missing_phone,
         count(*) FILTER (WHERE role IN ('user','user2') AND (national_id IS NULL OR national_id = ''))::int AS missing_national_id,
         count(*) FILTER (WHERE role IN ('user','user2') AND phone IS NOT NULL AND phone <> ''
                          AND national_id IS NOT NULL AND national_id <> ''
                          AND status <> 'disabled')::int AS inviteable_now
       FROM public.users`
    );

    // 4) Invitation list (paged, filtered, masked)
    const listParams = [];
    const where = [];
    if (campaignId) {
      listParams.push(campaignId);
      where.push(`a.campaign_id = $${listParams.length}`);
    }
    if (status) {
      listParams.push(status);
      where.push(`(${STATUS_CASE}) = $${listParams.length}`);
    }
    if (q) {
      listParams.push(`%${q}%`, q);
      where.push(`(u.name ILIKE $${listParams.length - 1}
                   OR u.phone LIKE $${listParams.length - 1}
                   OR u.national_id LIKE $${listParams.length}
                   OR u.reg_no ILIKE $${listParams.length - 1}
                   OR CAST(a.user_id AS TEXT) = $${listParams.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countParams = [...listParams];
    listParams.push(limit, offset);
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const listSql = `SELECT a.id, a.user_id, a.campaign_id,
            u.name, u.phone, u.national_id, u.reg_no, u.role, u.status AS user_status,
            c.status AS campaign_status,
            a.expires_at, a.consumed_at, a.password_set_at, a.failed_attempts,
            a.locked_until, a.created_at,
            ${STATUS_CASE} AS status
     FROM public.activations a
     JOIN public.users u ON u.id = a.user_id
     JOIN public.activation_campaigns c ON c.id = a.campaign_id
     ${whereSql}
     ORDER BY a.id DESC`;

    const invitations = await pool.query(`${listSql} LIMIT $${limitIdx} OFFSET $${offsetIdx}`, listParams);
    const matched = await pool.query(
      `SELECT count(*)::int AS matched
       FROM public.activations a
       JOIN public.users u ON u.id = a.user_id
       JOIN public.activation_campaigns c ON c.id = a.campaign_id ${whereSql}`,
      countParams
    );

    return NextResponse.json({
      totals: totals.rows[0],
      campaigns: campaigns.rows.map((row) => ({
        ...row,
        windowState:
          row.status === 'disabled' ? 'disabled'
            : new Date(row.starts_at) > new Date() ? 'scheduled'
              : new Date(row.ends_at) < new Date() ? 'closed' : 'open',
      })),
      liveCampaignId: campaigns.rows.find((row) => row.status === 'live')?.id ?? null,
      gaps: gaps.rows[0],
      invitations: invitations.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        campaignId: row.campaign_id,
        name: row.name || '—',
        phone: maskPhone(row.phone),
        nationalId: maskId(row.national_id),
        regNo: row.reg_no || null,
        role: row.role,
        userStatus: row.user_status,
        campaignStatus: row.campaign_status,
        status: row.status,
        expiresAt: row.expires_at,
        consumedAt: row.consumed_at,
        passwordSetAt: row.password_set_at,
        failedAttempts: row.failed_attempts,
        lockedUntil: row.locked_until,
        createdAt: row.created_at,
      })),
      matched: matched.rows[0].matched,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Activation dashboard error:', error);
    return NextResponse.json({ message: 'Failed to load activation dashboard' }, { status: 500 });
  }
}
