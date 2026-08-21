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

    const result = await pool.query(`
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
        dd.status,
        dd.submission_date,
        dd.created_at,
        dd.user_id,
        dd.sh_dividend_id,
        dd.entered_by,
        staff.username AS entered_by_name,
        sh_user.name AS shareholder_display_name
      FROM dividend_decisions dd
      LEFT JOIN users staff ON dd.entered_by = staff.id
      LEFT JOIN users sh_user ON dd.user_id = sh_user.id
      ORDER BY dd.created_at DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return res.status(500).json({ message: 'Failed to load forms' });
  }
}
