import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = 'shareholder@awash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { nationalId, newPassword } = req.body;

  if (!nationalId || !newPassword) {
    return res.status(400).json({ message: 'National ID and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  if (newPassword === DEFAULT_PASSWORD) {
    return res.status(400).json({ message: 'New password must be different from the default password' });
  }

  try {
    const pool = await connect();

    // Verify user exists and still has default password
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE national_id = $1 LIMIT 1',
      [nationalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isDefaultPassword = await bcrypt.compare(DEFAULT_PASSWORD, user.password_hash);

    if (!isDefaultPassword) {
      return res.status(403).json({ message: 'Password has already been changed. Please sign in normally.' });
    }

    // Hash and update the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );

    return res.status(200).json({ message: 'Password set successfully. You can now sign in.' });
  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
