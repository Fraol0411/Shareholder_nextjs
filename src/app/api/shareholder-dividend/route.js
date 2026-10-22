import { NextResponse } from 'next/server';
import { getPool, requireDividendDataAccess } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

/**
 * GET /api/shareholder-dividend?fiscal_year=
 *
 * Feeds the decision form (fiscal years + the balance being decided on), so it is
 * dividend data just like the statement page and sits behind the same data-viewing
 * switch. Rows are looked up by the account id carried by the token, so no
 * registration number is needed here.
 */
export async function GET(request) {
  const auth = await requireDividendDataAccess(request, { requireRegNo: false });
  if (auth.error) return auth.error;

  try {
    const userId = auth.viewer.userId;
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscal_year');

    // ── 1. Fetch all fiscal years that have dividend data for this user ──
    const pool = getPool();
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
