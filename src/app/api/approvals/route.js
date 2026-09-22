import { NextResponse } from 'next/server';
import { getPool, requirePermission } from '../../../libs/serverAuth';

export const runtime = 'nodejs';

const DECISION_SELECT = `
  SELECT
    dd.id,
    dd.file_number,
    dd.shareholder_name,
    dd.email,
    dd.phone,
    dd.fiscal_year,
    dd.decision_type,
    dd.amount_to_convert,
    dd.amount_to_withdraw,
    dd.payment_method,
    dd.bank_name,
    dd.branch_name,
    dd.account_number,
    COALESCE(NULLIF(btrim(dd.status), ''), 'pending') AS status,
    dd.submission_date,
    dd.created_at,
    dd.user_id,
    dd.entered_by,
    dd.sh_dividend_id,
    dd.reviewed_at,
    dd.reviewed_by,
    dd.rejection_reason,
    dd.internal_note,
    u.reg_no,
    u.national_id,
    u.name AS user_display_name,
    reviewer.username AS reviewed_by_name
  FROM public.dividend_decisions dd
  LEFT JOIN public.users u ON u.id = dd.user_id
  LEFT JOIN public.users reviewer ON reviewer.id = dd.reviewed_by
`;

async function requireApprovalsAccess(request) {
  const approve = await requirePermission(request, 'decisions.approve');
  if (!approve.error) return approve;
  const viewAll = await requirePermission(request, 'decisions.view_all');
  if (!viewAll.error) return viewAll;
  return approve;
}

export async function GET(request) {
  const auth = await requireApprovalsAccess(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || '').trim().toLowerCase();
    const fiscalYear = (searchParams.get('fiscal_year') || '').trim();
    const decisionType = (searchParams.get('decision_type') || '').trim();
    const search = (searchParams.get('search') || '').trim();

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`COALESCE(NULLIF(btrim(dd.status), ''), 'pending') = $${params.length}`);
    }
    if (fiscalYear) {
      params.push(fiscalYear);
      conditions.push(`dd.fiscal_year = $${params.length}`);
    }
    if (decisionType) {
      params.push(decisionType);
      conditions.push(`dd.decision_type = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(`(
        lower(dd.shareholder_name) LIKE $${idx}
        OR lower(COALESCE(dd.file_number, '')) LIKE $${idx}
        OR lower(COALESCE(u.reg_no, '')) LIKE $${idx}
        OR COALESCE(dd.phone, '') LIKE $${idx}
      )`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const pool = getPool();
    const result = await pool.query(
      `${DECISION_SELECT}
       ${where}
       ORDER BY COALESCE(dd.submission_date, dd.created_at) DESC NULLS LAST, dd.id DESC`,
      params
    );

    const countsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE COALESCE(NULLIF(btrim(status), ''), 'pending') = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE COALESCE(NULLIF(btrim(status), ''), 'pending') = 'approved')::int AS approved,
         COUNT(*) FILTER (WHERE COALESCE(NULLIF(btrim(status), ''), 'pending') = 'rejected')::int AS rejected
       FROM public.dividend_decisions`
    );

    const countsRow = countsResult.rows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };

    return NextResponse.json(
      {
        decisions: result.rows,
        counts: {
          all: countsRow.total,
          pending: countsRow.pending,
          approved: countsRow.approved,
          rejected: countsRow.rejected,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List approvals error:', error);
    if (error.code === '42703') {
      return NextResponse.json(
        {
          message:
            'Approval columns are missing. Run scripts/approvals_migration.sql on the database, then retry.',
          error: error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to load approvals', error: error.message },
      { status: 500 }
    );
  }
}
