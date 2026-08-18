// pages/api/dividend/[id].js
import { connect } from '../../../libs/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const pool = await connect();

    const result = await pool.query(
      `SELECT 
        dd.*,
        u.username AS entered_by_name
      FROM dividend_decisions dd
      LEFT JOIN users u ON dd.entered_by = u.id
      WHERE dd.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
