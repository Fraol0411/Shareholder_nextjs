import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function GET(request) {
  try {
    // ── Authenticate ──
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.id;

    const result = await pool.query(
      `SELECT
         id, file_number, shareholder_name, email, phone,
         submission_date, fiscal_year, decision_type,
         amount_to_convert, amount_to_withdraw,
         payment_method, bank_name, branch_name, account_number,
         status, created_at
       FROM public.dividend_decisions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ decisions: result.rows }, { status: 200 });
  } catch (error) {
    console.error('My decisions fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch decisions', error: error.message },
      { status: 500 }
    );
  }
}
