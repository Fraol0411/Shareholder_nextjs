import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reg_no = searchParams.get('reg_no');
    const fiscal_year = searchParams.get('fiscal_year');

    if (!reg_no) {
      return NextResponse.json({ message: 'reg_no is required' }, { status: 400 });
    }

    // 1. Fetch all available fiscal years for this specific shareholder
    // We JOIN the users table because reg_no is now stored there, linked by user_id
    const yearsRes = await pool.query(
      `SELECT DISTINCT d.fiscal_year 
       FROM public.sh_dividend d
       JOIN public.users u ON d.user_id = u.id
       WHERE u.reg_no = $1 
       ORDER BY d.fiscal_year DESC`,
      [reg_no]
    );
    const fiscalYears = yearsRes.rows.map(r => r.fiscal_year);

    // 2. Fetch the specific joined record if a fiscal year is selected
    let records = [];
    if (fiscal_year) {
      const res = await pool.query(
        `SELECT 
           u.reg_no, u.sif_no, u.name AS sh_name, u.phone, u.national_id,
           d.sn, d.paidup_capital, d.dividend_declared, d.dividend_bf, d.total_dividend, d.fiscal_year
         FROM public.sh_dividend d
         JOIN public.users u ON d.user_id = u.id
         WHERE u.reg_no = $1 AND d.fiscal_year = $2
         LIMIT 1`,
        [reg_no, fiscal_year]
      );
      records = res.rows;
    }

    return NextResponse.json({ fiscalYears, records }, { status: 200 });
  } catch (error) {
    console.error('Dividend detail fetch error:', error);
    return NextResponse.json({ message: 'Error fetching dividend details', error: error.message }, { status: 500 });
  }
}