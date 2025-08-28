// pages/api/dividend/submit.js
import { connect } from '../../../libs/db'; // Your DB connection
import jwt from 'jsonwebtoken';

// Secret should match login
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 🔐 1. Verify JWT from Authorization header
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

  // ✅ Authenticated: `decoded` = { id, username, role }

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

  // 🛑 2. Validate required fields
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

    // ✅ Insert into dividend_decisions
    await pool.request()
      .input('file_number', file_number)
      .input('shareholder_name', shareholder_name)
      .input('email', email || null)
      .input('phone', phone || null)
      .input('fiscal_year', fiscal_year)
      .input('decision_type', decision_type)
      .input('amount_to_convert', amount_to_convert || null)
      .input('amount_to_withdraw', amount_to_withdraw || null)
      .input('payment_method', payment_method || null)
      .input('bank_name', bank_name || null)
      .input('branch_name', branch_name || null)
      .input('account_number', account_number || null)
      .input('entered_by', decoded.id) // 👈 Who submitted it
      .query(`
        INSERT INTO dividend_decisions (
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
        VALUES (
          @file_number,
          @shareholder_name,
          @email,
          @phone,
          @fiscal_year,
          @decision_type,
          @amount_to_convert,
          @amount_to_withdraw,
          @payment_method,
          @bank_name,
          @branch_name,
          @account_number,
          @entered_by
        )
      `);

    return res.status(201).json({
      message: 'Dividend decision submitted successfully',
    });
  } catch (error) {
    console.error('Error saving dividend decision:', error);
    return res.status(500).json({ message: 'Failed to submit decision' });
  }
}