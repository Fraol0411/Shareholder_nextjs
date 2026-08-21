import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET: Fetch shareholders ONLY for the selected fiscal year
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscal_year');

    if (!fiscalYear) {
      return NextResponse.json([], { status: 200 });
    }

    // JOIN users and sh_dividend to get the full profile + dividend info
    const res = await pool.query(
      `SELECT 
         d.id, d.user_id, d.sn, d.paidup_capital, d.dividend_declared, d.dividend_bf, d.total_dividend, d.fiscal_year,
         u.reg_no, u.sif_no, u.name AS sh_name, u.phone, u.national_id
       FROM public.sh_dividend d
       JOIN public.users u ON d.user_id = u.id
       WHERE d.fiscal_year = $1 
       ORDER BY d.id ASC`,
      [fiscalYear]
    );
    return NextResponse.json(res.rows, { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
  }
}

// PUT: Update a shareholder record (updates both sh_dividend and users)
export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, user_id } = data; // id is sh_dividend.id, user_id is users.id

    // 1. Update sh_dividend (financials and fiscal year)
    const dividendQuery = `
      UPDATE public.sh_dividend 
      SET sn=$1, paidup_capital=$2, dividend_declared=$3, dividend_bf=$4, total_dividend=$5, fiscal_year=$6
      WHERE id=$7
    `;
    const dividendValues = [
      data.sn, data.paidup_capital, data.dividend_declared, data.dividend_bf, data.total_dividend, data.fiscal_year, id
    ];
    await pool.query(dividendQuery, dividendValues);

    // 2. Update users (personal details)
    if (user_id) {
      const userQuery = `
        UPDATE public.users 
        SET name=$1, reg_no=$2, sif_no=$3, phone=$4, national_id=$5, updated_at=CURRENT_TIMESTAMP
        WHERE id=$6
      `;
      const userValues = [
        data.sh_name, data.reg_no, data.sif_no, data.phone, data.national_id, user_id
      ];
      await pool.query(userQuery, userValues);
    }

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ message: 'Error updating data', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a shareholder dividend record
export async function DELETE(request) {
  try {
    const { id } = await request.json(); // id is sh_dividend.id

    // Only delete the dividend record for that specific fiscal year.
    // We do NOT delete the user account, as they may have records for other fiscal years.
    await pool.query('DELETE FROM public.sh_dividend WHERE id=$1', [id]);

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
  }
}