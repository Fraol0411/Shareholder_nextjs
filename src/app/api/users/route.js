import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { resolveRoleIdByName } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const ALLOWED_ROLES = ['staff', 'admin'];

function requireAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { error: NextResponse.json({ message: 'Forbidden: admin access required' }, { status: 403 }) };
    }
    return { decoded };
  } catch {
    return { error: NextResponse.json({ message: 'Invalid token' }, { status: 401 }) };
  }
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.role, u.name, u.phone, u.role_id, r.name AS role_name
       FROM public.users u
       LEFT JOIN public.roles r ON r.id = u.role_id
       WHERE u.role IN ('staff', 'admin')
          OR r.name IN ('staff', 'admin')
       ORDER BY u.username ASC`
    );
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: 'Username, password, and role are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const existing = await pool.query('SELECT id FROM public.users WHERE username = $1', [username.trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const roleId = await resolveRoleIdByName(role);
    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await pool.query(
      `INSERT INTO public.users (username, password_hash, role, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, name, phone, role_id`,
      [username.trim(), passwordHash, role, roleId]
    );

    return NextResponse.json({ message: 'User created successfully', user: inserted.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { id, username, role, password } = await request.json();

    if (!id || !username || !role) {
      return NextResponse.json({ message: 'User id, username, and role are required' }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }
    if (password && password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const existing = await pool.query(
      'SELECT id FROM public.users WHERE username = $1 AND id <> $2',
      [username.trim(), id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const roleId = await resolveRoleIdByName(role);

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE public.users
         SET username = $1, role = $2, role_id = $3, password_hash = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [username.trim(), role, roleId, passwordHash, id]
      );
    } else {
      await pool.query(
        `UPDATE public.users
         SET username = $1, role = $2, role_id = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [username.trim(), role, roleId, id]
      );
    }

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'User id is required' }, { status: 400 });
    }
    if (String(auth.decoded.id) === String(id)) {
      return NextResponse.json({ message: 'You cannot delete your own account' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM public.users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
