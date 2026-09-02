import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = 'shareholder@awash';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { nationalId, identifier, userType } = req.body;

  const loginId = (identifier ?? nationalId ?? '').trim();
  const type = userType || (nationalId ? 'individual' : null);

  if (!loginId) {
    return res.status(400).json({ message: 'Identification number is required' });
  }

  if (!type || !['individual', 'corporate'].includes(type)) {
    return res.status(400).json({ message: 'User type (individual or corporate) is required' });
  }

  if (!/^\d+$/.test(loginId)) {
    return res.status(400).json({ message: 'Identification number must contain digits only' });
  }

  try {
    const pool = await connect();

    // Both individual National ID and corporate TIN are stored in national_id
    const result = await pool.query(
      `SELECT id, username, password_hash, name, phone, reg_no, national_id, role
       FROM users
       WHERE national_id = $1
       LIMIT 1`,
      [loginId]
    );

    if (result.rows.length === 0) {
      const message =
        type === 'corporate'
          ? 'No account found with this TIN. Please contact support.'
          : 'No account found with this National ID. Please contact support.';
      return res.status(404).json({ message });
    }

    const user = result.rows[0];
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
