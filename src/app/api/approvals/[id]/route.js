import { NextResponse } from 'next/server';
import { getPool, requirePermission } from '../../../../libs/serverAuth';

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

async function getDecisionById(pool, id) {
  const result = await pool.query(`${DECISION_SELECT} WHERE dd.id = $1`, [id]);
  return result.rows[0] || null;
}

async function requireApprovalsAccess(request) {
  const approve = await requirePermission(request, 'decisions.approve');
  if (!approve.error) return approve;
  const viewAll = await requirePermission(request, 'decisions.view_all');
  if (!viewAll.error) return viewAll;
  return approve;
}

export async function GET(request, { params }) {
  const auth = await requireApprovalsAccess(request);
  if (auth.error) return auth.error;

  try {
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: 'Invalid decision id' }, { status: 400 });
    }

    const decision = await getDecisionById(getPool(), id);
    if (!decision) {
      return NextResponse.json({ message: 'Decision not found' }, { status: 404 });
    }

    return NextResponse.json({ decision }, { status: 200 });
  } catch (error) {
    console.error('Get approval error:', error);
    return NextResponse.json(
      { message: 'Failed to load decision', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const id = Number((await params).id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: 'Invalid decision id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim().toLowerCase();

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { message: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const permission = action === 'approve' ? 'decisions.approve' : 'decisions.reject';
    const auth = await requirePermission(request, permission);
    if (auth.error) return auth.error;

    const rejectionReason = String(body.rejection_reason || '').trim();
    const internalNote = String(body.internal_note || '').trim() || null;

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });
    }

    const pool = getPool();
    const existing = await pool.query(
      `SELECT id, COALESCE(NULLIF(btrim(status), ''), 'pending') AS status
       FROM public.dividend_decisions
       WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ message: 'Decision not found' }, { status: 404 });
    }

    if (existing.rows[0].status !== 'pending') {
      return NextResponse.json(
        { message: 'This decision has already been reviewed' },
        { status: 409 }
      );
    }

    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    await pool.query(
      `UPDATE public.dividend_decisions
       SET status = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = $2,
           rejection_reason = $3,
           internal_note = COALESCE($4, internal_note)
       WHERE id = $5`,
      [
        nextStatus,
        auth.decoded.id,
        action === 'reject' ? rejectionReason : null,
        internalNote,
        id,
      ]
    );

    const decision = await getDecisionById(pool, id);
    return NextResponse.json(
      {
        message: action === 'approve' ? 'Decision approved successfully' : 'Decision rejected successfully',
        decision,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Review approval error:', error);
    // Likely missing migration columns
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
      { message: 'Failed to review decision', error: error.message },
      { status: 500 }
    );
  }
}
