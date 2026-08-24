import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = 'shareholder@awash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { nationalId } = req.body;

  if (!nationalId) {
    return res.status(400).json({ message: 'National ID is required' });
  }

  try {
    const pool = await connect();

    // Look up user by national_id
    const result = await pool.query(
      `SELECT id, username, password_hash, name, phone, reg_no, national_id, role
       FROM users
       WHERE national_id = $1
       LIMIT 1`,
      [nationalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with this National ID. Please contact support.' });
    }

    const user = result.rows[0];

    // Check if the password is still the default
    const isDefaultPassword = await bcrypt.compare(DEFAULT_PASSWORD, user.password_hash);

    return res.status(200).json({
      message: 'User found',
      exists: true,
      needsPasswordChange: isDefaultPassword,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        reg_no: user.reg_no,
        national_id: user.national_id,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
