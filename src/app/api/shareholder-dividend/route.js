import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export async function GET(request) {
  try {
    // ── Authenticate user from Bearer token ──
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
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscal_year');

    // ── 1. Fetch all fiscal years that have dividend data for this user ──
    const yearsRes = await pool.query(
      `SELECT DISTINCT d.fiscal_year
       FROM public.sh_dividend d
       WHERE d.user_id = $1
       ORDER BY d.fiscal_year DESC`,
      [userId]
    );
    const fiscalYears = yearsRes.rows.map((r) => r.fiscal_year);

    // ── 2. If a fiscal year is selected, return the dividend record ──
    let dividend = null;
    if (fiscalYear) {
      const res = await pool.query(
        `SELECT
           d.id AS sh_dividend_id,
           d.fiscal_year,
           d.paidup_capital,
           d.dividend_declared,
           d.dividend_bf,
           d.total_dividend,
           u.name AS shareholder_name,
           u.phone,
           u.reg_no,
           u.sif_no
         FROM public.sh_dividend d
         JOIN public.users u ON d.user_id = u.id
         WHERE d.user_id = $1 AND d.fiscal_year = $2
         LIMIT 1`,
        [userId, fiscalYear]
      );
      dividend = res.rows[0] || null;
    }

    return NextResponse.json({ fiscalYears, dividend }, { status: 200 });
  } catch (error) {
    console.error('Shareholder dividend API error:', error);
    return NextResponse.json(
      { message: 'Error fetching dividend data', error: error.message },
      { status: 500 }
    );
  }
}
