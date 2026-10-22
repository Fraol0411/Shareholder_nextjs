import { NextResponse } from 'next/server';
import { getPool, requireOperator } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

// Registry housekeeping list — only staff and admins work with fiscal years,
// and shareholders never need to know which years exist before they are shown
// their own data, so this is operator-only.
export async function GET(request) {
  const auth = await requireOperator(request);
  if (auth.error) return auth.error;

  try {
    const pool = getPool();
    const res = await pool.query(
      'SELECT DISTINCT fiscal_year FROM public.sh_dividend ORDER BY fiscal_year DESC'
    );
    return NextResponse.json(res.rows.map((r) => r.fiscal_year), { status: 200 });
  } catch (error) {
    console.error('Fiscal years fetch error:', error);
    return NextResponse.json({ message: 'Error fetching fiscal years', error: error.message }, { status: 500 });
  }
}