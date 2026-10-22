import { NextResponse } from 'next/server';
import { getPool, requireDividendDataAccess } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

/**
 * GET /api/dividend-detail?reg_no=&fiscal_year=
 *
 * A shareholder is always shown their OWN record: the registration number is
 * taken from the account behind the Bearer token, and any reg_no in the query
 * string is ignored. Staff and admins may look any shareholder up, because they
 * work on behalf of people who cannot access the portal.
 *
 * The whole endpoint also sits behind the shareholder data-viewing switch
 * (requireDividendDataAccess), so an admin can close self-service in one click.
 */
export async function GET(request) {
  const auth = await requireDividendDataAccess(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const requestedRegNo = (searchParams.get('reg_no') || '').trim();
  const fiscal_year = searchParams.get('fiscal_year');

  // Operators must say whose record they want; shareholders get their own.
  const reg_no = auth.viewer.isOperator ? requestedRegNo : auth.viewer.regNo;
  if (!reg_no) {
    return NextResponse.json({ message: 'reg_no is required' }, { status: 400 });
  }

  try {
    const pool = getPool();

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
