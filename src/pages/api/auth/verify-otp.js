/**
 * API ROUTE: POST /api/auth/verify-otp
 * ──────────────────────────────────────
 * Step 2 of the OTP password-reset flow.
 *
 * REQUEST BODY:
 *   { identifier: string, otp: string }
 *
 * SUCCESS RESPONSE (200):
 *   { resetToken: string }   — a short-lived signed JWT (10-min TTL)
 *                              used to authorise the password-reset step.
 *
 * WHAT NEEDS TO BE IMPLEMENTED:
 *
 * 1. DB TABLE — same otp_requests table created for forgot-password.js.
 *
 * 2. ENV VARIABLES REQUIRED:
 *      JWT_SECRET=...         (already set — used for regular login)
 *      OTP_RESET_SECRET=...   (use a DIFFERENT secret so reset tokens
 *                              cannot be confused with session tokens)
 *
 * 3. OTP VERIFICATION LOGIC:
 *      - Fetch the most recent non-expired, unused OTP for this user.
 *      - Compare the submitted plain OTP to the stored hash with bcrypt.compare().
 *      - On match: mark the row as used=TRUE, issue a signed reset token.
 *      - On failure: increment an attempt counter (max 5 attempts) and
 *        invalidate the OTP after the limit to prevent brute-force.
 *
 * 4. RESET TOKEN PAYLOAD:
 *      { userId: number, purpose: 'password_reset' }
 *      expiresIn: '10m'
 *      Signed with OTP_RESET_SECRET.
 */

// import { connect } from '../../../libs/db';  // uncomment when implementing
// import bcrypt from 'bcryptjs';               // uncomment when implementing
// import jwt from 'jsonwebtoken';              // uncomment when implementing

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // ── STUB: remove this block and implement the real logic below ──
  return res.status(503).json({
    message: 'OTP verification is not yet configured.',
  });

  /* ── REAL IMPLEMENTATION (uncomment and complete) ──────────────
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ message: 'Identifier and OTP are required.' });
  }

  try {
    const pool = await connect();

    // 1. Look up user
    const userResult = await pool.query(
      `SELECT id FROM users
       WHERE phone = $1 OR username = $1 OR reg_no = $1 OR national_id = $1
       LIMIT 1`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    const userId = userResult.rows[0].id;

    // 2. Fetch latest valid OTP
    const otpResult = await pool.query(
      `SELECT id, otp_hash FROM otp_requests
       WHERE user_id = $1 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    const { id: otpId, otp_hash } = otpResult.rows[0];

    // 3. Verify OTP
    const isValid = await bcrypt.compare(otp, otp_hash);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    // 4. Mark OTP as used
    await pool.query(`UPDATE otp_requests SET used = TRUE WHERE id = $1`, [otpId]);

    // 5. Issue short-lived reset token
    const resetToken = jwt.sign(
      { userId, purpose: 'password_reset' },
      process.env.OTP_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.status(200).json({ resetToken });
  } catch (error) {
    console.error('verify-otp error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
  ────────────────────────────────────────────────────────────── */
}
