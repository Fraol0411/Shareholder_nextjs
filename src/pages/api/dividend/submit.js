// pages/api/dividend/submit.js
import { connect } from '../../../libs/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }

  const {
    file_number,
    shareholder_name,
    email,
    phone,
    fiscal_year,
    decision_type,
    amount_to_convert,
    amount_to_withdraw,
    payment_method,
    bank_name,
    branch_name,
    account_number,
  } = req.body;

  if (!file_number || !shareholder_name || !fiscal_year || !decision_type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (decision_type === 'withdraw' && !amount_to_withdraw) {
    return res.status(400).json({ message: 'Withdraw amount is required' });
  }

  if (decision_type === 'withdraw' && payment_method === 'bank-transfer') {
    if (!bank_name || !account_number) {
      return res.status(400).json({ message: 'Bank name and account number are required for bank transfer' });
    }
  }

  try {
    const pool = await connect();

    await pool.query(
      `INSERT INTO dividend_decisions (
        file_number,
        shareholder_name,
        email,
        phone,
        fiscal_year,
        decision_type,
        amount_to_convert,
        amount_to_withdraw,
        payment_method,
        bank_name,
        branch_name,
        account_number,
        entered_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        file_number,
        shareholder_name,
        email || null,
        phone || null,
        fiscal_year,
        decision_type,
        amount_to_convert || null,
        amount_to_withdraw || null,
        payment_method || null,
        bank_name || null,
        branch_name || null,
        account_number || null,
        decoded.id,
      ]
    );

    return res.status(201).json({
      message: 'Dividend decision submitted successfully',
    });
  } catch (error) {
    console.error('Error saving dividend decision:', error);
    return res.status(500).json({ message: 'Failed to submit decision' });
  }
}
