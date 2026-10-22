import { NextResponse } from 'next/server';
import { getPool, requireDividendDataAccess } from '../../../../libs/serverAuth';

export const runtime = 'nodejs';

/**
 * POST /api/decisions/submit
 *
 * A shareholder's own dividend decision. It reads the balance being decided on and
 * quotes it back in its validation messages, so it sits behind the same
 * data-viewing switch as the read endpoints: closing access has to close the form
 * as well as the statement, and a decision made while the book is shut cannot be
 * honoured.
 */
export async function POST(request) {
  const auth = await requireDividendDataAccess(request, { requireRegNo: false });
  if (auth.error) return auth.error;

  try {
    const pool = getPool();
    const userId = auth.viewer.userId;
    const body = await request.json();

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
      sh_dividend_id,
    } = body;

    // ── Validation ──
    if (!fiscal_year || !decision_type || !shareholder_name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['withdraw', 'fiscalreinvest', 'reinvest'].includes(decision_type)) {
      return NextResponse.json({ message: 'Invalid decision type' }, { status: 400 });
    }

    const dividendBalanceResult = await pool.query(
      `SELECT total_dividend
       FROM public.sh_dividend
       WHERE user_id = $1 AND fiscal_year = $2
       ORDER BY id DESC
       LIMIT 1`,
      [userId, fiscal_year]
    );

    const availableBalance = Number(dividendBalanceResult.rows[0]?.total_dividend || 0);

    if (availableBalance <= 0 && ['reinvest', 'fiscalreinvest'].includes(decision_type)) {
      return NextResponse.json(
        { message: 'There is no available dividend balance to reinvest.' },
        { status: 400 }
      );
    }

    if (decision_type === 'withdraw') {
      const withdrawAmount = Number(amount_to_withdraw || 0);
      const convertAmount = Number(amount_to_convert || 0);

      if (!amount_to_withdraw || withdrawAmount <= 0) {
        return NextResponse.json({ message: 'Withdraw amount is required and must be greater than zero.' }, { status: 400 });
      }

      if (convertAmount < 0 || withdrawAmount < 0) {
        return NextResponse.json({ message: 'Reinvested and withdrawn amounts cannot be negative.' }, { status: 400 });
      }

      if (convertAmount + withdrawAmount > availableBalance + 0.000001) {
        return NextResponse.json(
          {
            message: `The total reinvested and withdrawn amount (${Number(convertAmount + withdrawAmount).toFixed(2)} ETB) exceeds the available balance (${Number(availableBalance).toFixed(2)} ETB).`,
          },
          { status: 400 }
        );
      }
    }

    if (decision_type === 'withdraw' && payment_method === 'bank-transfer') {
      if (!bank_name || !account_number) {
        return NextResponse.json(
          { message: 'Bank name and account number are required for bank transfer' },
          { status: 400 }
        );
      }
    }

    if (['reinvest', 'fiscalreinvest'].includes(decision_type)) {
      const reinvestAmount = availableBalance;
      body.amount_to_convert = reinvestAmount;
      body.amount_to_withdraw = null;
    }

    // ── Check for duplicate submission (same user + fiscal year) ──
    const dupCheck = await pool.query(
      `SELECT id FROM public.dividend_decisions
       WHERE user_id = $1 AND fiscal_year = $2`,
      [userId, fiscal_year]
    );
    if (dupCheck.rows.length > 0) {
      return NextResponse.json(
        { message: 'You have already submitted a decision for this fiscal year.' },
        { status: 409 }
      );
    }

    // ── Insert decision ──
    const submitConvertAmount = ['reinvest', 'fiscalreinvest'].includes(decision_type)
      ? availableBalance
      : Number(amount_to_convert || 0);

    const result = await pool.query(
      `INSERT INTO public.dividend_decisions (
        file_number, shareholder_name, email, phone,
        fiscal_year, decision_type,
        amount_to_convert, amount_to_withdraw,
        payment_method, bank_name, branch_name, account_number,
        user_id, sh_dividend_id, status, submission_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending', CURRENT_TIMESTAMP)
      RETURNING id, status, created_at, submission_date`,
      [
        file_number || null,
        shareholder_name,
        email || null,
        phone || null,
        fiscal_year,
        decision_type,
        submitConvertAmount || null,
        decision_type === 'withdraw' ? Number(amount_to_withdraw || 0) : null,
        payment_method || null,
        bank_name || null,
        branch_name || null,
        account_number || null,
        userId,
        sh_dividend_id || null,
      ]
    );

    return NextResponse.json(
      { message: 'Decision submitted successfully', decision: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Decision submit error:', error);
    return NextResponse.json(
      { message: 'Failed to submit decision', error: error.message },
      { status: 500 }
    );
  }
}
