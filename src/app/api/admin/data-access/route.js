import { NextResponse } from 'next/server';
import {
  getPool,
  requireAdmin,
  getDataViewingState,
  DATA_VIEWING_KEY,
  DATA_VIEWING_NOTE_KEY,
} from '../../../../libs/serverAuth';

export const runtime = 'nodejs';

const SHAREHOLDER_ROLES = ['user', 'user2'];
const MAX_NOTE_LENGTH = 300;
const ROW_LIMIT = 25;

// The list never needs to know a shareholder's real contact details — one masked
// number is enough to tell two similar names apart.
function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `${digits.slice(0, 3)}••••${digits.slice(-3)}`;
}

/*
 * Admin control plane for shareholder data viewing. Two switches:
 *
 *   GLOBAL  GET / PUT   system_settings.shareholder_data_viewing  ('on' | 'off')
 *   PERSON  POST        users.status                             ('active' | 'disabled')
 *
 * Enforcement lives in requireDividendDataAccess() (libs/serverAuth.js), which
 * every dividend-data endpoint calls — so flipping a switch here takes effect on
 * the shareholder's next request, with no re-login and no cache to wait out.
 *
 * users.status is not a new idea: campaign generation already skips
 * `status = 'disabled'`, so suspending a shareholder also keeps them out of the
 * next invitation CSV.
 */

/**
 * Rows for the per-shareholder switch list: everyone currently blocked, or the
 * shareholders matching `q` once the admin starts typing.
 */
async function listShareholders(pool, q) {
  if (q) {
    const asNumber = Number.parseInt(q, 10);
    return pool.query(
      `SELECT id, COALESCE(NULLIF(name, ''), username) AS name, reg_no, phone, status, role,
              count(*) OVER() AS total
       FROM public.users
       WHERE role = ANY($1)
         AND (COALESCE(NULLIF(name, ''), username) ILIKE $2
              OR reg_no ILIKE $2
              OR phone ILIKE $2
              OR national_id ILIKE $2
              OR ($3::bigint IS NOT NULL AND id = $3))
       ORDER BY status = 'disabled' DESC, name ASC NULLS LAST
       LIMIT $4`,
      [SHAREHOLDER_ROLES, `%${q}%`, Number.isNaN(asNumber) ? null : asNumber, ROW_LIMIT]
    );
  }

  return pool.query(
    `SELECT id, COALESCE(NULLIF(name, ''), username) AS name, reg_no, phone, status, role,
            count(*) OVER() AS total
     FROM public.users
     WHERE role = ANY($1) AND status = 'disabled'
     ORDER BY updated_at DESC NULLS LAST, id DESC
     LIMIT $2`,
    [SHAREHOLDER_ROLES, ROW_LIMIT]
  );
}

/**
 * Current state of both switches, how many shareholders are suspended, and the
 * rows for the per-shareholder list.
 * Query: ?q=  (name, registration number, phone, national ID or user id)
 */
export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';

  try {
    const pool = getPool();
    const { enabled, note } = await getDataViewingState();

    const meta = await pool.query(
      `SELECT s.updated_at, s.value, COALESCE(NULLIF(u.name, ''), u.username) AS updated_by_name
       FROM public.system_settings s
       LEFT JOIN public.users u ON u.id = s.updated_by
       WHERE s.key = $1`,
      [DATA_VIEWING_KEY]
    );

    const stats = await pool.query(
      `SELECT count(*) FILTER (WHERE role = ANY($1) AND status = 'disabled')::int AS disabled,
              count(*) FILTER (WHERE role = ANY($1))::int AS shareholders
       FROM public.users`,
      [SHAREHOLDER_ROLES]
    );

    const rows = await listShareholders(pool, q);

    return NextResponse.json({
      enabled,
      note,
      lastChangedAt: meta.rows[0]?.updated_at ?? null,
      lastChangedBy: meta.rows[0]?.updated_by_name ?? null,
      stats: stats.rows[0],
      query: q,
      shareholders: {
        total: Number(rows.rows[0]?.total ?? 0),
        limit: ROW_LIMIT,
        rows: rows.rows.map((row) => ({
          userId: row.id,
          name: row.name || '—',
          regNo: row.reg_no || null,
          phone: maskPhone(row.phone),
          role: row.role,
          status: row.status,
          blocked: row.status === 'disabled',
        })),
      },
    });
  } catch (error) {
    console.error('Data access settings read error:', error);
    return NextResponse.json(
      { message: 'We could not read the access settings. Please try again.' },
      { status: 500 }
    );
  }
}

/** Put the global switch: { enabled: boolean, note?: string }. */
export async function PUT(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  let enabled;
  let note;
  try {
    const body = await request.json();
    enabled = body.enabled;
    note = body.note;
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ message: 'enabled must be true or false' }, { status: 400 });
  }
  if (note !== undefined && (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH)) {
    return NextResponse.json({ message: `note must be a string of at most ${MAX_NOTE_LENGTH} characters` }, { status: 400 });
  }

  try {
    const pool = getPool();
    // Both keys land on ONE connection inside one transaction, so the flag and its
    // note can never be seen half-updated by the next shareholder request.
    const client = await pool.connect();
    const upsert = async (key, value) => {
      await client.query(
        `INSERT INTO public.system_settings (key, value, updated_at, updated_by)
         VALUES ($1, $2, NOW(), $3)
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
        [key, value, auth.decoded.id]
      );
    };

    try {
      await client.query('BEGIN');
      await upsert(DATA_VIEWING_KEY, enabled ? 'on' : 'off');
      if (note !== undefined) await upsert(DATA_VIEWING_NOTE_KEY, note.trim());
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const state = await getDataViewingState();
    return NextResponse.json({
      message: enabled
        ? 'Shareholders can view their dividend data again.'
        : 'Shareholder dividend data viewing is now closed.',
      ...state,
    });
  } catch (error) {
    console.error('Data access settings write error:', error);
    return NextResponse.json(
      { message: 'We could not save the access settings. Please try again.' },
      { status: 500 }
    );
  }
}

/** Suspend or restore one shareholder: { userId, action: 'disable' | 'enable' }. */
export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  let userId;
  let action;
  try {
    const body = await request.json();
    userId = Number(body.userId);
    action = body.action;
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ message: 'A valid userId is required' }, { status: 400 });
  }
  if (!['disable', 'enable'].includes(action)) {
    return NextResponse.json({ message: 'action must be disable or enable' }, { status: 400 });
  }

  try {
    const pool = getPool();
    const userRes = await pool.query(
      'SELECT id, name, role, status FROM public.users WHERE id = $1 LIMIT 1',
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ message: 'Shareholder not found' }, { status: 404 });
    }

    // Staff and admin accounts are managed on /users, never switched off here —
    // one click must not be able to lock the operations team out of its own tools.
    if (!SHAREHOLDER_ROLES.includes(user.role)) {
      return NextResponse.json(
        { message: 'This is a staff or admin account. Manage it from the Users page instead.' },
        { status: 400 }
      );
    }

    const nextStatus = action === 'disable' ? 'disabled' : 'active';
    if (user.status === nextStatus) {
      return NextResponse.json({
        message:
          action === 'disable'
            ? 'That shareholder is already blocked.'
            : 'That shareholder can already view dividend data.',
      });
    }

    const updated = await pool.query(
      `UPDATE public.users
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = ANY($3)
       RETURNING id, status`,
      [nextStatus, userId, SHAREHOLDER_ROLES]
    );
    if (updated.rows.length === 0) {
      return NextResponse.json(
        { message: 'Someone else changed this account in the meantime. Reload and try again.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message:
        action === 'disable'
          ? `${user.name || 'This shareholder'} can no longer view dividend data, and will be left out of the next invitation round.`
          : `${user.name || 'This shareholder'} can view dividend data again.`,
      userId,
      status: updated.rows[0].status,
    });
  } catch (error) {
    console.error('Shareholder status update error:', error);
    return NextResponse.json(
      { message: 'We could not update that shareholder. Please try again.' },
      { status: 500 }
    );
  }
}
