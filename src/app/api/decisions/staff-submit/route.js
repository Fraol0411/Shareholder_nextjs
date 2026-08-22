import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function POST(request) {
  try {
    // ── Authenticate staff user ──
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

    // Only staff/admin can use this endpoint
    if (decoded.role !== 'staff' && decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: staff access required' }, { status: 403 });
    }

    const staffUserId = decoded.id;
    const body = await request.json();

    const {
      user_id,           // The shareholder's user ID
      sh_dividend_id,    // The sh_dividend record ID
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
    } = body;

    // ── Validation ──
    if (!user_id || !fiscal_year || !decision_type || !shareholder_name) {
      return NextResponse.json({ message: 'Missing required fields (user_id, fiscal_year, decision_type, shareholder_name)' }, { status: 400 });
    }

    if (!['withdraw', 'fiscalreinvest', 'reinvest'].includes(decision_type)) {
      return NextResponse.json({ message: 'Invalid decision type' }, { status: 400 });
    }

    if (decision_type === 'withdraw' && !amount_to_withdraw) {
      return NextResponse.json({ message: 'Withdraw amount is required' }, { status: 400 });
    }

    if (decision_type === 'withdraw' && payment_method === 'bank-transfer') {
      if (!bank_name || !account_number) {
        return NextResponse.json(
          { message: 'Bank name and account number are required for bank transfer' },
          { status: 400 }
        );
      }
    }

    // ── Insert decision ──
    const result = await pool.query(
      `INSERT INTO public.dividend_decisions (
        shareholder_name, email, phone,
        fiscal_year, decision_type,
        amount_to_convert, amount_to_withdraw,
        payment_method, bank_name, branch_name, account_number,
        user_id, sh_dividend_id, entered_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id, status, created_at`,
      [
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
        user_id,
        sh_dividend_id || null,
        staffUserId,
      ]
    );

    return NextResponse.json(
      { message: 'Decision submitted successfully on behalf of shareholder', decision: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Staff decision submit error:', error);
    return NextResponse.json(
      { message: 'Failed to submit decision', error: error.message },
      { status: 500 }
    );
  }
}
