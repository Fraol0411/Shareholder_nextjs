import { NextResponse } from 'next/server';
import { getPool, requirePermission } from '../../../../libs/serverAuth';

export const runtime = 'nodejs';

async function requireApprovalsAccess(request) {
  const approve = await requirePermission(request, 'decisions.approve');
  if (!approve.error) return approve;
  const viewAll = await requirePermission(request, 'decisions.view_all');
  if (!viewAll.error) return viewAll;
  return approve;
}

/**
 * Lightweight counts for notification badges.
 * GET /api/approvals/summary
 */
export async function GET(request) {
  const auth = await requireApprovalsAccess(request);
  if (auth.error) return auth.error;

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (
           WHERE COALESCE(NULLIF(btrim(status), ''), 'pending') = 'pending'
         )::int AS pending,
         COUNT(*) FILTER (
           WHERE COALESCE(NULLIF(btrim(status), ''), 'pending') = 'approved'
         )::int AS approved,
         COUNT(*) FILTER (
           WHERE COALESCE(NULLIF(btrim(status), ''), 'pending') = 'rejected'
         )::int AS rejected
       FROM public.dividend_decisions`
    );

    const row = result.rows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
    return NextResponse.json(
      {
        total: row.total,
        pending: row.pending,
        approved: row.approved,
        rejected: row.rejected,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Approvals summary error:', error);
    return NextResponse.json(
      { message: 'Failed to load approval summary', error: error.message },
      { status: 500 }
    );
  }
}
