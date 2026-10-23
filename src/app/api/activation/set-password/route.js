import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, getJwtSecret } from '../../../../libs/serverAuth';

const DEFAULT_PASSWORD = 'shareholder@awash';

export async function POST(request) {
  let setupToken, newPassword;
  try {
    const body = await request.json();
    setupToken = String(body.setupToken || '');
    newPassword = String(body.newPassword || '');
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  if (!setupToken) {
    return NextResponse.json({ message: 'Your setup session is missing. Please restart activation.' }, { status: 401 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
  }
  if (newPassword === DEFAULT_PASSWORD) {
    return NextResponse.json({ message: 'New password must be different from the default password' }, { status: 400 });
  }

  let payload;
  try {
    payload = jwt.verify(setupToken, getJwtSecret());
  } catch {
    return NextResponse.json({ message: 'Your setup session has expired. Please restart activation.' }, { status: 401 });
  }

  if (payload.purpose !== 'password-setup' || !payload.userId || !payload.activationId) {
    return NextResponse.json({ message: 'Your setup session is not valid. Please restart activation.' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // The invitation must be consumed (verified) but not yet completed
      const activationResult = await client.query(
        `SELECT id, user_id FROM public.activations
         WHERE id = $1 AND consumed_at IS NOT NULL AND password_set_at IS NULL
         FOR UPDATE`,
        [payload.activationId]
      );
      if (activationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'This activation has already been completed or is no longer valid.' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await client.query(
        `UPDATE public.users
         SET password_hash = $1, status = 'active', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [passwordHash, activationResult.rows[0].user_id]
      );

      await client.query(
        `UPDATE public.activations SET password_set_at = NOW() WHERE id = $1`,
        [payload.activationId]
      );

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Password set successfully. Your account is activated — please sign in.' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Activation set-password error:', error);
    return NextResponse.json({ message: 'Failed to set password. Please try again.' }, { status: 500 });
  }
}
