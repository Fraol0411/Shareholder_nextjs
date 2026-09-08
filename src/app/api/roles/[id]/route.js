import { NextResponse } from 'next/server';
import { getPool, requirePermission } from '../../../../libs/serverAuth';

export const runtime = 'nodejs';

function normalizeRoleName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

async function getRoleBundle(pool, id) {
  const roleResult = await pool.query(
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
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );

  if (roleResult.rows.length === 0) return null;

  const permissionsResult = await pool.query(
    `SELECT permission_id FROM public.role_permissions WHERE role_id = $1`,
    [id]
  );

  return {
    ...roleResult.rows[0],
    permission_ids: permissionsResult.rows.map((row) => row.permission_id),
  };
}

export async function GET(request, { params }) {
  const auth = await requirePermission(request, 'roles.view');
  if (auth.error) return auth.error;

  try {
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: 'Invalid role id' }, { status: 400 });
    }

    const role = await getRoleBundle(getPool(), id);
    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ role }, { status: 200 });
  } catch (error) {
    console.error('Get role error:', error);
    return NextResponse.json({ message: 'Failed to load role', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = await requirePermission(request, 'roles.update');
  if (auth.error) return auth.error;

  const pool = getPool();
  const client = await pool.connect();

  try {
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: 'Invalid role id' }, { status: 400 });
    }

    const body = await request.json();
    const description = body.description !== undefined ? String(body.description || '').trim() || null : undefined;
    const permissionIds = Array.isArray(body.permission_ids)
      ? [...new Set(body.permission_ids.map((pid) => Number(pid)).filter((pid) => Number.isFinite(pid)))]
      : null;

    const existing = await client.query(
      `SELECT id, name, is_system FROM public.roles WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }

    const current = existing.rows[0];
    let nextName = current.name;

    if (body.name !== undefined) {
      nextName = normalizeRoleName(body.name);
      if (!nextName) {
        return NextResponse.json({ message: 'Role name is required' }, { status: 400 });
      }
      if (current.is_system && nextName !== current.name) {
        return NextResponse.json({ message: 'System role names cannot be changed' }, { status: 400 });
      }
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE public.roles
       SET name = $1,
           description = COALESCE($2, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nextName, description === undefined ? current.description : description, id]
    );

    // Keep legacy users.role text in sync when role is renamed
    if (nextName !== current.name) {
      await client.query(
        `UPDATE public.users SET role = $1 WHERE role_id = $2`,
        [nextName, id]
      );
    }

    if (permissionIds) {
      await client.query(`DELETE FROM public.role_permissions WHERE role_id = $1`, [id]);
      if (permissionIds.length > 0) {
        await client.query(
          `INSERT INTO public.role_permissions (role_id, permission_id)
           SELECT $1, p.id
           FROM public.permissions p
           WHERE p.id = ANY($2::int[])`,
          [id, permissionIds]
        );
      }
    }

    await client.query('COMMIT');

    const role = await getRoleBundle(pool, id);
    return NextResponse.json({ message: 'Role updated successfully', role }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return NextResponse.json({ message: 'A role with this name already exists' }, { status: 409 });
    }
    console.error('Update role error:', error);
    return NextResponse.json({ message: 'Failed to update role', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  const auth = await requirePermission(request, 'roles.delete');
  if (auth.error) return auth.error;

  try {
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: 'Invalid role id' }, { status: 400 });
    }

    const pool = getPool();
    const existing = await pool.query(
      `SELECT id, name, is_system FROM public.roles WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 });
    }
    if (existing.rows[0].is_system) {
      return NextResponse.json({ message: 'System roles cannot be deleted' }, { status: 400 });
    }

    const usersUsingRole = await pool.query(
      `SELECT COUNT(*)::int AS count FROM public.users WHERE role_id = $1`,
      [id]
    );
    if (usersUsingRole.rows[0].count > 0) {
      return NextResponse.json(
        { message: 'Cannot delete a role that is assigned to users. Reassign users first.' },
        { status: 400 }
      );
    }

    await pool.query(`DELETE FROM public.roles WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Role deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json({ message: 'Failed to delete role', error: error.message }, { status: 500 });
  }
}
