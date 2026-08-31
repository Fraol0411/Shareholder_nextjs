import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_PASSWORD = 'shareholder@awash';

// POST: Create a new shareholder (user + dividend record)
export async function POST(request) {
  try {
    const data = await request.json();
    const {
      sh_name, reg_no, sif_no, phone, national_id,
      sn, paidup_capital, dividend_declared, dividend_bf, total_dividend,
      fiscal_year,
    } = data;

    // ── Validation ──
    if (!reg_no || !fiscal_year) {
      return NextResponse.json(
        { message: 'Registration No and Fiscal Year are required.' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      // ── STEP 1: Find or create user (linked by reg_no) ──
      const userRes = await client.query(
        'SELECT id FROM public.users WHERE reg_no = $1 LIMIT 1',
        [reg_no]
      );

      let userId;
      let userCreated = false;

      if (userRes.rows.length === 0) {
        // Create new user
        userCreated = true;
        let username = sh_name || reg_no;
        try {
          const insertRes = await client.query(
            `INSERT INTO public.users (username, password_hash, role, name, reg_no, sif_no, phone, national_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [username, passwordHash, 'user', sh_name || null, reg_no, sif_no || null, phone || null, national_id || null]
          );
          userId = insertRes.rows[0].id;
        } catch (err) {
          if (err.code === '23505') {
            // Duplicate username → append reg_no
            const fallback = `${username}_${reg_no}`;
            const insertRes = await client.query(
              `INSERT INTO public.users (username, password_hash, role, name, reg_no, sif_no, phone, national_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
              [fallback, passwordHash, 'user', sh_name || null, reg_no, sif_no || null, phone || null, national_id || null]
            );
            userId = insertRes.rows[0].id;
          } else {
            throw err;
          }
        }
      } else {
        userId = userRes.rows[0].id;
        // Update personal details
        await client.query(
          `UPDATE public.users SET name=$1, sif_no=$2, phone=$3, national_id=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5`,
          [sh_name || null, sif_no || null, phone || null, national_id || null, userId]
        );
      }

      // ── STEP 2: Check for existing dividend record ──
      const divRes = await client.query(
        'SELECT id FROM public.sh_dividend WHERE user_id = $1 AND fiscal_year = $2',
        [userId, fiscal_year]
      );

      let inserted = false;
      let updated = false;

      if (divRes.rows.length === 0) {
        // Insert new dividend record
        await client.query(
          `INSERT INTO public.sh_dividend (sn, paidup_capital, dividend_declared, dividend_bf, total_dividend, fiscal_year, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [sn || 0, paidup_capital || 0, dividend_declared || 0, dividend_bf || 0, total_dividend || 0, fiscal_year, userId]
        );
        inserted = true;
      } else {
        // Update existing record
        await client.query(
          `UPDATE public.sh_dividend SET sn=$1, paidup_capital=$2, dividend_declared=$3, dividend_bf=$4, total_dividend=$5 WHERE id=$6`,
          [sn || 0, paidup_capital || 0, dividend_declared || 0, dividend_bf || 0, total_dividend || 0, divRes.rows[0].id]
        );
        updated = true;
      }

      await client.query('COMMIT');

      return NextResponse.json(
        {
          message: inserted ? 'Shareholder created successfully.' : updated ? 'Shareholder record updated.' : 'Done.',
          userCreated,
          inserted,
          updated,
        },
        { status: 200 }
      );
    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error('Create shareholder DB error:', dbErr);
      return NextResponse.json({ message: 'Database error', error: dbErr.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create shareholder error:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

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

// PATCH: Reset a user's password to the default password
export async function PATCH(request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const result = await pool.query(
      'UPDATE public.users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, user_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Password reset to default successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Error resetting password', error: error.message }, { status: 500 });
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