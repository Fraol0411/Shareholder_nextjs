import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper 1: Find column headers case-insensitively and ignore trailing spaces
const getVal = (row, key) => {
  const matchKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
  return matchKey ? row[matchKey] : null;
};

// Helper 2: Safely parse numeric values into Floats
const parseFloatSafe = (val) => {
  if (val === null || val === undefined || val === '') return 0; 
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
};

// Helper 3: Safely parse integer values
const parseIntSafe = (val) => {
  if (val === null || val === undefined || val === '') return 0; 
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : Math.round(num);
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // 1. Deduplicate by reg_no + fiscal_year in memory
    const uniqueRowsMap = new Map();
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const reg_no = String(getVal(row, 'reg_no') || '').trim();
      const fiscal_year = getVal(row, 'fiscal_year') ? String(getVal(row, 'fiscal_year')).trim() : null;
      
      if (!reg_no) {
        throw new Error(`Validation failed: Excel row ${i + 2} is missing a valid 'reg_no'.`);
      }
      if (!fiscal_year) {
        throw new Error(`Validation failed: Excel row ${i + 2} is missing a valid 'fiscal_year'.`);
      }
      
      // Key ensures we process multiple fiscal years for the same user correctly
      const key = `${reg_no}_${fiscal_year}`;
      uniqueRowsMap.set(key, row); 
    }
    
    const uniqueRows = Array.from(uniqueRowsMap.values());
    const totalRows = uniqueRows.length;

    if (totalRows === 0) {
      return NextResponse.json({ message: 'No valid data found in the Excel file.' }, { status: 400 });
    }

    const defaultPassword = "shareholder@awash"; 
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const client = await pool.connect();
    
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    let usersCreated = 0;

    try {
      await client.query('BEGIN');

      for (const row of uniqueRows) {
        // Extract and clean values robustly
        const sn = parseIntSafe(getVal(row, 'sn'));
        const reg_no = String(getVal(row, 'reg_no') || '').trim();
        const sif_no = getVal(row, 'sif_no') ? String(getVal(row, 'sif_no')).trim() : null;
        const sh_name = getVal(row, 'sh_name') ? String(getVal(row, 'sh_name')).trim() : null;
        
        const paidup_capital = parseFloatSafe(getVal(row, 'paidup_capital'));
        const dividend_declared = parseFloatSafe(getVal(row, 'dividend_declared'));
        const dividend_bf = parseFloatSafe(getVal(row, 'dividend_bf'));
        const total_dividend = parseFloatSafe(getVal(row, 'total_dividend'));
        
        let phone = getVal(row, 'phone');
        phone = phone ? String(phone).replace(/\.0$/, '').trim() : null; 
        
        let national_id = getVal(row, 'national_id');
        national_id = national_id ? String(national_id).replace(/\.0$/, '').trim() : null;
        
        const fiscal_year = String(getVal(row, 'fiscal_year')).trim();

        // ==========================================
        // STEP 1: FIND OR CREATE USER (Linked by reg_no)
        // ==========================================
        const userRes = await client.query(
          'SELECT id FROM public.users WHERE reg_no = $1 LIMIT 1',
          [reg_no]
        );
        
        let userId;
        const isUserNew = userRes.rows.length === 0;

        if (isUserNew) {
          // Create new user
          let username = sh_name || reg_no;
          try {
            const insertUserRes = await client.query(`
              INSERT INTO public.users (username, password_hash, role, name, reg_no, sif_no, phone, national_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
            `, [username, passwordHash, 'user', sh_name, reg_no, sif_no, phone, national_id]);
            userId = insertUserRes.rows[0].id;
          } catch (err) {
            // Handle duplicate username constraint gracefully
            if (err.code === '23505') { 
              const fallbackUsername = `${username}_${reg_no}`;
              const insertUserRes = await client.query(`
                INSERT INTO public.users (username, password_hash, role, name, reg_no, sif_no, phone, national_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
              `, [fallbackUsername, passwordHash, 'user', sh_name, reg_no, sif_no, phone, national_id]);
              userId = insertUserRes.rows[0].id;
            } else {
              throw err;
            }
          }
          usersCreated++;
        } else {
          userId = userRes.rows[0].id;
          // Update user personal details if they changed in the Excel
          await client.query(`
            UPDATE public.users 
            SET name = $1, sif_no = $2, phone = $3, national_id = $4, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $5
          `, [sh_name, sif_no, phone, national_id, userId]);
        }

        // ==========================================
        // STEP 2: FIND OR CREATE DIVIDEND (Linked by user_id + fiscal_year)
        // ==========================================
        const divRes = await client.query(
          'SELECT id, sn, paidup_capital, dividend_declared, dividend_bf, total_dividend FROM public.sh_dividend WHERE user_id = $1 AND fiscal_year = $2',
          [userId, fiscal_year]
        );

        const existingDiv = divRes.rows[0];
        const isDividendNew = !existingDiv;

        if (isDividendNew) {
          // New fiscal year for this user -> Insert new dividend record
          await client.query(`
            INSERT INTO public.sh_dividend (sn, paidup_capital, dividend_declared, dividend_bf, total_dividend, fiscal_year, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [sn, paidup_capital, dividend_declared, dividend_bf, total_dividend, fiscal_year, userId]);
          inserted++;
        } else {
          // Existing fiscal year -> Check if data changed
          const isUnchanged = (
            Number(existingDiv.sn || 0) === Number(sn || 0) &&
            Number(existingDiv.paidup_capital || 0) === Number(paidup_capital || 0) &&
            Number(existingDiv.dividend_declared || 0) === Number(dividend_declared || 0) &&
            Number(existingDiv.dividend_bf || 0) === Number(dividend_bf || 0) &&
            Number(existingDiv.total_dividend || 0) === Number(total_dividend || 0)
          );

          if (isUnchanged) {
            unchanged++;
          } else {
            await client.query(`
              UPDATE public.sh_dividend 
              SET sn = $1, paidup_capital = $2, dividend_declared = $3, dividend_bf = $4, total_dividend = $5 
              WHERE id = $6
            `, [sn, paidup_capital, dividend_declared, dividend_bf, total_dividend, existingDiv.id]);
            updated++;
          }
        }
      }

      await client.query('COMMIT');
      
      return NextResponse.json({ 
        message: 'Excel data processed successfully',
        totalRows,
        inserted,
        updated,
        unchanged,
        usersCreated
      }, { status: 200 });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        message: 'Database error during processing. Transaction rolled back.', 
        error: dbError.message 
      }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Upload/Validation error:', error);
    return NextResponse.json({ 
      message: error.message || 'Internal Server Error', 
      error: error.message 
    }, { status: 500 });
  }
}