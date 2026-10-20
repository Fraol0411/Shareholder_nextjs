import { connect } from '../../../libs/db'; // Adjust path if your libs folder is elsewhere

export async function POST() {
  try {
    const pool = await connect();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Fetch users with a phone number. 
      // TIP: If you only want to target shareholders, change the WHERE clause to:
      // WHERE phone IS NOT NULL AND phone != '' AND role IN ('user', 'user2')
      const usersRes = await client.query(`
        SELECT id, phone 
        FROM users 
        WHERE phone IS NOT NULL AND phone != ''
      `);

      const csvRows = [];

      for (const user of usersRes.rows) {
        // 1. Generate random 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // 2. Format phone number to ensure it starts with 251 (e.g., 0911... -> 251911...)
        let cleanPhone = user.phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '251' + cleanPhone.substring(1);
        } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('251')) {
          cleanPhone = '251' + cleanPhone;
        }

        // 3. Create the exact message format requested
        const message = `your awashinsurance one time use verification code is ${otp}`;

        // 4. Update the user record in the database
        await client.query(
          `UPDATE users SET 
            otp = $1,
            otp_expires_at = NOW() + INTERVAL '15 minutes',
            otp_last_sent_at = NOW(),
            otp_24h_count = otp_24h_count + 1,
            otp_window_start = CASE 
              WHEN otp_window_start IS NULL OR otp_window_start < NOW() - INTERVAL '24 hours' 
              THEN NOW() 
              ELSE otp_window_start 
            END,
            otp_failed_attempts = 0
           WHERE id = $2`,
          [otp, user.id]
        );

        csvRows.push({ phone_number: cleanPhone, message });
      }

      await client.query('COMMIT');

      // 5. Generate CSV content matching your uploaded template format
      const csvHeader = 'phone_number,message\n';
      const csvBody = csvRows.map(row => `${row.phone_number},"${row.message}"`).join('\n');
      const csvContent = csvHeader + csvBody;

      // 6. Return as a downloadable file
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sms_template_${Date.now()}.csv"`,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Generate OTP CSV error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}