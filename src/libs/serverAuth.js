import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export function getPool() {
  return pool;
}

export function getJwtSecret() {
  return JWT_SECRET;
}

/**
 * Verify Bearer token. Returns { decoded } or { error: NextResponse }.
 */
export function requireAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return { decoded };
  } catch {
    return { error: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) };
  }
}

/**
 * Require admin role (legacy role string on JWT).
 */
export function requireAdmin(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth;
  if (auth.decoded.role !== 'admin') {
    return { error: NextResponse.json({ message: 'Forbidden: admin access required' }, { status: 403 }) };
  }
  return auth;
}

/**
 * Require a specific permission action for the authenticated user.
 * Falls back to JWT role === 'admin' if RBAC tables are unavailable.
 */
export async function requirePermission(request, permissionAction) {
  const auth = requireAuth(request);
  if (auth.error) return auth;

  if (auth.decoded.role === 'admin') {
    return { ...auth, permissions: ['*'] };
  }

  try {
    const result = await pool.query(
      `SELECT p.action
       FROM public.users u
       JOIN public.roles r ON r.id = u.role_id
       JOIN public.role_permissions rp ON rp.role_id = r.id
       JOIN public.permissions p ON p.id = rp.permission_id
       WHERE u.id = $1 AND p.action = $2
       LIMIT 1`,
      [auth.decoded.id, permissionAction]
    );

    if (result.rows.length === 0) {
      return {
        error: NextResponse.json(
          { message: `Forbidden: missing permission ${permissionAction}` },
          { status: 403 }
        ),
      };
    }

    return auth;
  } catch (error) {
    console.error('Permission check error:', error);
    return { error: NextResponse.json({ message: 'Permission check failed' }, { status: 500 }) };
  }
}

export async function getUserPermissionActions(userId) {
  const result = await pool.query(
    `SELECT DISTINCT p.action
     FROM public.users u
     JOIN public.roles r ON r.id = u.role_id
     JOIN public.role_permissions rp ON rp.role_id = r.id
     JOIN public.permissions p ON p.id = rp.permission_id
     WHERE u.id = $1
     ORDER BY p.action`,
    [userId]
  );
  return result.rows.map((row) => row.action);
}

export async function resolveRoleIdByName(roleName) {
  const result = await pool.query(
    `SELECT id FROM public.roles WHERE lower(name) = lower($1) LIMIT 1`,
    [roleName]
  );
  return result.rows[0]?.id || null;
}

/* -----------------------------------------------------------------------------
 * Shareholder data-viewing switch
 *
 * Two controls, checked in one place so every data endpoint behaves identically:
 *   GLOBAL   public.system_settings.shareholder_data_viewing  ('on' | 'off')
 *   PERSON   public.users.status                              ('disabled' | 'locked')
 *
 * Staff and admin are never blocked by either: the switch is about shareholder
 * self-service, and somebody has to keep working while it is off.
 *
 * A missing settings row means "on" (fail-open on configuration, never on
 * authentication) so the portal cannot be switched off by an unapplied
 * migration. A failing query returns 500 instead of a guess.
 * -------------------------------------------------------------------------- */
export const DATA_VIEWING_KEY = 'shareholder_data_viewing';
export const DATA_VIEWING_NOTE_KEY = 'shareholder_data_viewing_note';

const OPERATOR_ROLES = ['admin', 'staff'];

export async function getSystemSetting(key, fallback = null) {
  const result = await pool.query(
    `SELECT value FROM public.system_settings WHERE key = $1 LIMIT 1`,
    [key]
  );
  return result.rows[0] ? result.rows[0].value : fallback;
}

export async function setSystemSetting(key, value, updatedBy = null) {
  const result = await pool.query(
    `INSERT INTO public.system_settings (key, value, updated_at, updated_by)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by
     RETURNING key, value, updated_at, updated_by`,
    [key, value, updatedBy]
  );
  return result.rows[0];
}

export async function getDataViewingState() {
  const value = await getSystemSetting(DATA_VIEWING_KEY, 'on');
  const note = await getSystemSetting(DATA_VIEWING_NOTE_KEY, '');
  return { enabled: value !== 'off', note: (note || '').trim() };
}

/**
 * Sign-in + switch check for anything that reads a shareholder's dividend data.
 *
 * Resolves the account from the database rather than trusting the JWT payload,
 * so a role or status change lands immediately instead of after token expiry.
 *
 * @param {Request} request
 * @param {{ requireRegNo?: boolean }} [options] Routes keyed on the registration
 *   number keep the default, so a half-linked account is never shown a blank
 *   statement instead of an explanation. Routes keyed on the account id (the
 *   decision form and the decision list) pass `requireRegNo: false`.
 * @returns {{ decoded, viewer: { isOperator: true, userId, regNo, role } } | { decoded, viewer: { isOperator: false, userId, regNo } } | { error }}
 */
export async function requireDividendDataAccess(request, { requireRegNo = true } = {}) {
  const auth = requireAuth(request);
  if (auth.error) return auth;

  try {
    const userRes = await pool.query(
      `SELECT id, reg_no, role, status FROM public.users WHERE id = $1 LIMIT 1`,
      [auth.decoded.id]
    );
    const user = userRes.rows[0];

    if (!user) {
      return { error: NextResponse.json({ message: 'Unauthorized: account no longer exists' }, { status: 401 }) };
    }

    if (OPERATOR_ROLES.includes(user.role)) {
      // Operators bypass the switch but are still ordinary accounts, so their id is
      // returned the same way a shareholder's is.
      return {
        decoded: auth.decoded,
        viewer: { isOperator: true, userId: user.id, regNo: user.reg_no, role: user.role },
      };
    }

    if (user.status === 'disabled') {
      return {
        error: NextResponse.json(
          { code: 'ACCOUNT_DISABLED', message: 'This account has been disabled. Please contact Awash support.' },
          { status: 403 }
        ),
      };
    }
    if (user.status === 'locked') {
      return {
        error: NextResponse.json(
          { code: 'ACCOUNT_LOCKED', message: 'This account is temporarily locked. Please try again later.' },
          { status: 403 }
        ),
      };
    }

    const { enabled, note } = await getDataViewingState();
    if (!enabled) {
      return {
        error: NextResponse.json(
          {
            code: 'DATA_VIEWING_CLOSED',
            message: note || 'Dividend data viewing is temporarily closed. Please check back later.',
          },
          { status: 403 }
        ),
      };
    }

    // A shareholder may only ever be shown the row their own account is linked to.
    if (requireRegNo && !user.reg_no) {
      return {
        error: NextResponse.json(
          { code: 'NO_REG_NO', message: 'No registration number is linked to this account. Please contact support.' },
          { status: 409 }
        ),
      };
    }

    return { decoded: auth.decoded, viewer: { isOperator: false, userId: user.id, regNo: user.reg_no } };
  } catch (error) {
    console.error('Dividend data access check error:', error);
    return { error: NextResponse.json({ message: 'Failed to check data access' }, { status: 500 }) };
  }
}

/** Gate for the operator-only registry endpoints (staff and admin). */
export async function requireOperator(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth;

  if (!OPERATOR_ROLES.includes(auth.decoded.role)) {
    return {
      error: NextResponse.json({ message: 'Forbidden: staff access required' }, { status: 403 }),
    };
  }
  return auth;
}
