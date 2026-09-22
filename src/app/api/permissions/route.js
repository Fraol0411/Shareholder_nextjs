import { NextResponse } from 'next/server';
import { getPool, requirePermission } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

export async function GET(request) {
  const auth = await requirePermission(request, 'permissions.view');
  if (auth.error) {
    // roles.view is enough to load catalog while editing roles
    const fallback = await requirePermission(request, 'roles.view');
    if (fallback.error) return fallback.error;
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, action, description, created_at, updated_at
       FROM public.permissions
       ORDER BY action ASC`
    );

    const grouped = {};
    result.rows.forEach((permission) => {
      const group = permission.action.split('.')[0] || 'other';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(permission);
    });

    return NextResponse.json(
      {
        permissions: result.rows,
        groups: grouped,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List permissions error:', error);
    return NextResponse.json(
      { message: 'Failed to load permissions', error: error.message },
      { status: 500 }
    );
  }
}
