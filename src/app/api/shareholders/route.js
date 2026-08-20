// import { NextResponse } from 'next/server';
// import { Pool } from 'pg';

// export const runtime = 'nodejs';
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// // GET: Fetch all shareholders
// export async function GET() {
//   try {
//     const res = await pool.query('SELECT * FROM public.sh_dividend ORDER BY id DESC');
//     return NextResponse.json(res.rows, { status: 200 });
//   } catch (error) {
//     console.error('Fetch error:', error);
//     return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
//   }
// }

// // PUT: Update a shareholder record
// export async function PUT(request) {
//   try {
//     const data = await request.json();
//     const { id } = data;
    
//     const query = `
//       UPDATE public.sh_dividend 
//       SET sn=$1, reg_no=$2, sif_no=$3, sh_name=$4, paidup_capital=$5, 
//           dividend_declared=$6, dividend_bf=$7, total_dividend=$8, 
//           phone=$9, national_id=$10, fiscal_year=$11
//       WHERE id=$12
//     `;
//     const values = [
//       data.sn, data.reg_no, data.sif_no, data.sh_name, data.paidup_capital,
//       data.dividend_declared, data.dividend_bf, data.total_dividend,
//       data.phone, data.national_id, data.fiscal_year, id
//     ];
    
//     await pool.query(query, values);
    
//     // Sync updates to the users table (matching by reg_no)
//     if (data.reg_no) {
//       await pool.query(`
//         UPDATE public.users 
//         SET name=$1, phone=$2, national_id=$3, updated_at=CURRENT_TIMESTAMP
//         WHERE reg_no=$4
//       `, [data.sh_name, data.phone, data.national_id, data.reg_no]);
//     }

//     return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
//   } catch (error) {
//     console.error('Update error:', error);
//     return NextResponse.json({ message: 'Error updating data', error: error.message }, { status: 500 });
//   }
// }

// // DELETE: Delete a shareholder record
// export async function DELETE(request) {
//   try {
//     const { id, reg_no } = await request.json();
    
//     // Delete from dividend table
//     await pool.query('DELETE FROM public.sh_dividend WHERE id=$1', [id]);
    
//     // Optional: Also delete associated user account created during upload
//     if(reg_no) {
//        await pool.query('DELETE FROM public.users WHERE reg_no=$1', [reg_no]);
//     }
    
//     return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
//   } catch (error) {
//     console.error('Delete error:', error);
//     return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
//   }
// }

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

    const res = await pool.query(
      'SELECT * FROM public.sh_dividend WHERE fiscal_year = $1 ORDER BY id ASC',
      [fiscalYear]
    );
    return NextResponse.json(res.rows, { status: 200 });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
  }
}

// PUT: Update a shareholder record
export async function PUT(request) {
  try {
    const data = await request.json();
    const { id } = data;

    const query = `
      UPDATE public.sh_dividend 
      SET sn=$1, reg_no=$2, sif_no=$3, sh_name=$4, paidup_capital=$5, 
          dividend_declared=$6, dividend_bf=$7, total_dividend=$8, 
          phone=$9, national_id=$10, fiscal_year=$11
      WHERE id=$12
    `;
    const values = [
      data.sn, data.reg_no, data.sif_no, data.sh_name, data.paidup_capital,
      data.dividend_declared, data.dividend_bf, data.total_dividend,
      data.phone, data.national_id, data.fiscal_year, id
    ];

    await pool.query(query, values);

    if (data.reg_no) {
      await pool.query(`
        UPDATE public.users 
        SET name=$1, phone=$2, national_id=$3, updated_at=CURRENT_TIMESTAMP
        WHERE reg_no=$4
      `, [data.sh_name, data.phone, data.national_id, data.reg_no]);
    }

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ message: 'Error updating data', error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a shareholder record
export async function DELETE(request) {
  try {
    const { id, reg_no } = await request.json();

    await pool.query('DELETE FROM public.sh_dividend WHERE id=$1', [id]);

    if (reg_no) {
      await pool.query('DELETE FROM public.users WHERE reg_no=$1', [reg_no]);
    }

    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
  }
}