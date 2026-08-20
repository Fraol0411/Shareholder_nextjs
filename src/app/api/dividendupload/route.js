// import { NextResponse } from 'next/server';
// import { Pool } from 'pg';
// import * as XLSX from 'xlsx';
// import bcrypt from 'bcryptjs';

// export const runtime = 'nodejs';

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// // Helper 1: Find column headers case-insensitively and ignore trailing spaces
// const getVal = (row, key) => {
//   const matchKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
//   return matchKey ? row[matchKey] : null;
// };

// // Helper 2: Safely parse numeric values into Floats (preserves decimals like "500.00")
// const parseFloatSafe = (val) => {
//   if (val === null || val === undefined || val === '') return 0; 
//   const num = parseFloat(String(val).replace(/,/g, ''));
//   return isNaN(num) ? 0 : num;
// };

// // Helper 3: Safely parse integer values (used for 'sn' which is likely still an integer)
// const parseIntSafe = (val) => {
//   if (val === null || val === undefined || val === '') return 0; 
//   const num = parseFloat(String(val).replace(/,/g, ''));
//   return isNaN(num) ? 0 : Math.round(num);
// };

// export async function POST(request) {
//   try {
//     const formData = await request.formData();
//     const file = formData.get('file');
    
//     if (!file) {
//       return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
//     }

//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);
    
//     // Parse Excel file
//     const workbook = XLSX.read(buffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

//     const defaultPassword = "shareholder@awash"; 
//     const passwordHash = await bcrypt.hash(defaultPassword, 10);

//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');
//       let processedCount = 0;

//       for (const row of data) {
//         // Extract and clean values robustly
//         const sn = parseIntSafe(getVal(row, 'sn'));
//         const reg_no = getVal(row, 'reg_no') ? String(getVal(row, 'reg_no')) : null;
//         const sif_no = getVal(row, 'sif_no') ? String(getVal(row, 'sif_no')) : null;
//         const sh_name = getVal(row, 'sh_name') ? String(getVal(row, 'sh_name')) : null;
        
//         // Parse financial columns safely into Floats/Numeric
//         const paidup_capital = parseFloatSafe(getVal(row, 'paidup_capital'));
//         const dividend_declared = parseFloatSafe(getVal(row, 'dividend_declared'));
//         const dividend_bf = parseFloatSafe(getVal(row, 'dividend_bf'));
//         const total_dividend = parseFloatSafe(getVal(row, 'total_dividend'));
        
//         // Phone and National ID might be parsed as numbers by Excel, force to string and remove trailing ".0"
//         let phone = getVal(row, 'phone');
//         phone = phone ? String(phone).replace(/\.0$/, '') : null; 
        
//         let national_id = getVal(row, 'national_id');
//         national_id = national_id ? String(national_id).replace(/\.0$/, '') : null;
        
//         const fiscal_year = getVal(row, 'fiscal_year') ? String(getVal(row, 'fiscal_year')) : null;

//         // 1. Insert into sh_dividend
//         const dividendQuery = `
//           INSERT INTO public.sh_dividend (
//             sn, reg_no, sif_no, sh_name, paidup_capital, 
//             dividend_declared, dividend_bf, total_dividend, 
//             phone, national_id, fiscal_year
//           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
//         `;
//         const dividendValues = [
//           sn, reg_no, sif_no, sh_name, paidup_capital,
//           dividend_declared, dividend_bf, total_dividend,
//           phone, national_id, fiscal_year
//         ];
        
//         await client.query(dividendQuery, dividendValues);

//         // 2. Insert into users
//         const username = sh_name;
        
//         const userQuery = `
//           INSERT INTO public.users (
//             username, password_hash, role, name, reg_no, sif_no, phone, national_id
//           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//           ON CONFLICT (username) DO UPDATE SET
//             name = EXCLUDED.name,
//             phone = EXCLUDED.phone,
//             national_id = EXCLUDED.national_id,
//             updated_at = CURRENT_TIMESTAMP;
//         `;
//         const userValues = [
//           username, passwordHash, 'user', sh_name, reg_no, 
//           sif_no, phone, national_id
//         ];
        
//         await client.query(userQuery, userValues);
//         processedCount++;
//       }

//       await client.query('COMMIT');
//       return NextResponse.json({ message: 'Data uploaded and users created successfully', count: processedCount }, { status: 200 });
      
//     } catch (dbError) {
//       await client.query('ROLLBACK');
//       console.error('Database error:', dbError);
//       return NextResponse.json({ message: 'Database error during processing', error: dbError.message }, { status: 500 });
//     } finally {
//       client.release();
//     }

//   } catch (error) {
//     console.error('Upload error:', error);
//     return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
//   }
// }

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

// Helper 2: Safely parse numeric values into Floats (preserves decimals like "500.00")
const parseFloatSafe = (val) => {
  if (val === null || val === undefined || val === '') return 0; 
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
};

// Helper 3: Safely parse integer values (used for 'sn' which is likely still an integer)
const parseIntSafe = (val) => {
  if (val === null || val === undefined || val === '') return 0; 
  const num = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(num) ? 0 : Math.round(num);
};

// Helper 4: Compare existing DB row with new Excel data to detect changes
const isDataUnchanged = (existing, newData) => {
  return (
    String(existing.sn || '') === String(newData.sn || '') &&
    String(existing.sif_no || '') === String(newData.sif_no || '') &&
    String(existing.sh_name || '') === String(newData.sh_name || '') &&
    parseFloat(existing.paidup_capital || 0) === newData.paidup_capital &&
    parseFloat(existing.dividend_declared || 0) === newData.dividend_declared &&
    parseFloat(existing.dividend_bf || 0) === newData.dividend_bf &&
    parseFloat(existing.total_dividend || 0) === newData.total_dividend &&
    String(existing.phone || '') === String(newData.phone || '') &&
    String(existing.national_id || '') === String(newData.national_id || '') &&
    String(existing.fiscal_year || '') === String(newData.fiscal_year || '')
  );
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
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // 1. Deduplicate and Validate reg_no in memory
    // Rule: If duplicate reg_no exists in the same file, keep the last occurrence.
    const uniqueRowsMap = new Map();
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const reg_no = String(getVal(row, 'reg_no') || '').trim();
      
      if (!reg_no) {
        throw new Error(`Validation failed: Excel row ${i + 2} is missing a valid 'reg_no'.`);
      }
      
      uniqueRowsMap.set(reg_no, row); 
    }
    
    const uniqueRows = Array.from(uniqueRowsMap.values());
    const totalRows = uniqueRows.length;

    if (totalRows === 0) {
      return NextResponse.json({ message: 'No valid data found in the Excel file.' }, { status: 400 });
    }

    const defaultPassword = "shareholder@awash"; 
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const client = await pool.connect();
    
    // Counters for the response summary
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
        const sif_no = getVal(row, 'sif_no') ? String(getVal(row, 'sif_no')) : null;
        const sh_name = getVal(row, 'sh_name') ? String(getVal(row, 'sh_name')) : null;
        
        const paidup_capital = parseFloatSafe(getVal(row, 'paidup_capital'));
        const dividend_declared = parseFloatSafe(getVal(row, 'dividend_declared'));
        const dividend_bf = parseFloatSafe(getVal(row, 'dividend_bf'));
        const total_dividend = parseFloatSafe(getVal(row, 'total_dividend'));
        
        let phone = getVal(row, 'phone');
        phone = phone ? String(phone).replace(/\.0$/, '') : null; 
        
        let national_id = getVal(row, 'national_id');
        national_id = national_id ? String(national_id).replace(/\.0$/, '') : null;
        
        const fiscal_year = getVal(row, 'fiscal_year') ? String(getVal(row, 'fiscal_year')) : null;

        const newRowData = {
          sn, reg_no, sif_no, sh_name, paidup_capital,
          dividend_declared, dividend_bf, total_dividend,
          phone, national_id, fiscal_year
        };

        // Step A: Check if shareholder already exists
        const checkRes = await client.query(
          'SELECT * FROM public.sh_dividend WHERE reg_no = $1', 
          [reg_no]
        );
        const existingRecord = checkRes.rows[0];
        const isNewShareholder = !existingRecord;

        // Step B: Atomic Upsert for sh_dividend
        const upsertQuery = `
          INSERT INTO public.sh_dividend (
            sn, reg_no, sif_no, sh_name, paidup_capital, 
            dividend_declared, dividend_bf, total_dividend, 
            phone, national_id, fiscal_year
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (reg_no)
          DO UPDATE SET
            sn = EXCLUDED.sn,
            sif_no = EXCLUDED.sif_no,
            sh_name = EXCLUDED.sh_name,
            paidup_capital = EXCLUDED.paidup_capital,
            dividend_declared = EXCLUDED.dividend_declared,
            dividend_bf = EXCLUDED.dividend_bf,
            total_dividend = EXCLUDED.total_dividend,
            phone = EXCLUDED.phone,
            national_id = EXCLUDED.national_id,
            fiscal_year = EXCLUDED.fiscal_year;
        `;
        
        const upsertValues = [
          sn, reg_no, sif_no, sh_name, paidup_capital,
          dividend_declared, dividend_bf, total_dividend,
          phone, national_id, fiscal_year
        ];
        
        await client.query(upsertQuery, upsertValues);

        // Step C: Handle Users Table & Counters
        if (isNewShareholder) {
          // NEW: Insert into users table
          const username = sh_name || reg_no; // Fallback to reg_no if sh_name is somehow null
          
          const userQuery = `
            INSERT INTO public.users (
              username, password_hash, role, name, reg_no, sif_no, phone, national_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          const userValues = [
            username, passwordHash, 'user', sh_name, reg_no, 
            sif_no, phone, national_id
          ];
          
          await client.query(userQuery, userValues);
          
          inserted++;
          usersCreated++;
        } else {
          // EXISTING: Do NOT modify users table. Just track if data actually changed.
          if (isDataUnchanged(existingRecord, newRowData)) {
            unchanged++;
          } else {
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