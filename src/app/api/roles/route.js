import { NextResponse } from 'next/server';
import { getPool, requirePermission } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

function normalizeRoleName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export async function GET(request) {
  const auth = await requirePermission(request, 'roles.view');
  if (auth.error) return auth.error;

  try {
    const pool = getPool();
    const rolesResult = await pool.query(
      `SELECT
         r.id,
         r.name,
         r.description,
         r.is_system,
         r.created_at,
         r.updated_at,
         COUNT(DISTINCT rp.permission_id)::int AS permission_count,
         COUNT(DISTINCT u.id)::int AS user_count
       FROM public.roles r
       LEFT JOIN public.role_permissions rp ON rp.role_id = r.id
       LEFT JOIN public.users u ON u.role_id = r.id
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.name ASC`
    );

    const permissionsResult = await pool.query(
      `SELECT role_id, permission_id
       FROM public.role_permissions`
    );

    const permissionsByRole = {};
    permissionsResult.rows.forEach((row) => {
      if (!permissionsByRole[row.role_id]) permissionsByRole[row.role_id] = [];
      permissionsByRole[row.role_id].push(row.permission_id);
    });

    const roles = rolesResult.rows.map((role) => ({
      ...role,
      permission_ids: permissionsByRole[role.id] || [],
    }));

    return NextResponse.json({ roles }, { status: 200 });
  } catch (error) {
    console.error('List roles error:', error);
    return NextResponse.json({ message: 'Failed to load roles', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requirePermission(request, 'roles.create');
  if (auth.error) return auth.error;

  const pool = getPool();
  const client = await pool.connect();

  try {
    const body = await request.json();
    const name = normalizeRoleName(body.name);
    const description = String(body.description || '').trim() || null;
    const permissionIds = Array.isArray(body.permission_ids)
      ? [...new Set(body.permission_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id)))]
      : [];

    if (!name) {
      return NextResponse.json({ message: 'Role name is required' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ message: 'Role name is too long' }, { status: 400 });
    }

    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO public.roles (name, description, is_system)
       VALUES ($1, $2, FALSE)
       RETURNING id, name, description, is_system, created_at, updated_at`,
      [name, description]
    );

    const role = inserted.rows[0];

    if (permissionIds.length > 0) {
      await client.query(
        `INSERT INTO public.role_permissions (role_id, permission_id)
         SELECT $1, p.id
         FROM public.permissions p
         WHERE p.id = ANY($2::int[])`,
        [role.id, permissionIds]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        message: 'Role created successfully',
        role: { ...role, permission_ids: permissionIds, permission_count: permissionIds.length, user_count: 0 },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return NextResponse.json({ message: 'A role with this name already exists' }, { status: 409 });
    }
    console.error('Create role error:', error);
    return NextResponse.json({ message: 'Failed to create role', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
