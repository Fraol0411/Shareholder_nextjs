import { NextResponse } from 'next/server';
import { getPool, requireDividendDataAccess } from '../../../../libs/serverAuth';

export const runtime = 'nodejs';

/**
 * GET /api/decisions/my-decisions
 *
 * Submitted decisions quote the dividend amounts they were made about, so this
 * list is dividend data too and honours the shareholder data-viewing switch.
 * Scoped to the account behind the token, so no registration number is required.
 */
export async function GET(request) {
  const auth = await requireDividendDataAccess(request, { requireRegNo: false });
  if (auth.error) return auth.error;

  try {
    const userId = auth.viewer.userId;

    const result = await getPool().query(
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
