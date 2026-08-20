import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const res = await pool.query(
      'SELECT DISTINCT fiscal_year FROM public.sh_dividend ORDER BY fiscal_year DESC'
    );
    return NextResponse.json(res.rows.map((r) => r.fiscal_year), { status: 200 });
  } catch (error) {
    console.error('Fiscal years fetch error:', error);
    return NextResponse.json({ message: 'Error fetching fiscal years', error: error.message }, { status: 500 });
  }
}