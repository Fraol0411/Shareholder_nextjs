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
