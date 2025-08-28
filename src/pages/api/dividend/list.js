// pages/api/dividend/list.js
import { connect } from '../../../libs/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const pool = await connect();

    const result = await pool.request().query(`
      SELECT 
        dd.id,
        dd.file_number,
        dd.shareholder_name,
        dd.email,
        dd.phone,
        dd.fiscal_year,
        dd.decision_type,
        dd.amount_to_convert,
        dd.amount_to_withdraw,
        dd.payment_method,
        dd.bank_name,
        dd.branch_name,
        dd.account_number,
        dd.created_at,
        u.username AS entered_by_name
      FROM dividend_decisions dd
      LEFT JOIN users u ON dd.entered_by = u.id
      ORDER BY dd.created_at DESC
    `);

    return res.status(200).json(result.recordset);



  } catch (error) {
    console.error('Error fetching forms:', error);
    return res.status(500).json({ message: 'Failed to load forms' });
  }
}