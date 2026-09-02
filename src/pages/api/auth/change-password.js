import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DEFAULT_PASSWORD = 'shareholder@awash';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session. Please sign in again.' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  if (newPassword === DEFAULT_PASSWORD) {
    return res.status(400).json({ message: 'New password must be different from the default password' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from your current password' });
  }

  try {
    const pool = await connect();
    const result = await pool.query('SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1', [
      decoded.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isCurrentValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      passwordHash,
      user.id,
    ]);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
