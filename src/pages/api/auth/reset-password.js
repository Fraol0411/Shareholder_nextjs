/**
 * API ROUTE: POST /api/auth/reset-password
 * ─────────────────────────────────────────
 * Step 3 of the OTP password-reset flow.
 *
 * REQUEST BODY:
 *   { resetToken: string, newPassword: string }
 *
 * SUCCESS RESPONSE (200):
 *   { message: "Password updated successfully." }
 *
 * WHAT NEEDS TO BE IMPLEMENTED:
 *
 * 1. ENV VARIABLES REQUIRED:
 *      OTP_RESET_SECRET=...   (same secret used in verify-otp.js)
 *      JWT_SECRET=...         (already set)
 *
 * 2. VALIDATION:
 *      - Verify the reset token with jwt.verify() using OTP_RESET_SECRET.
 *      - Confirm token payload contains { purpose: 'password_reset' }.
 *      - Reject expired tokens (jwt.verify throws TokenExpiredError automatically).
 *
 * 3. PASSWORD UPDATE:
 *      - Hash the new password with bcrypt (cost factor 10 minimum).
 *      - UPDATE users SET password_hash = $1 WHERE id = $2
 *
 * 4. POST-RESET CLEANUP:
 *      - Invalidate all remaining unused OTPs for this user (belt-and-suspenders).
 *      - Optionally invalidate all existing session tokens (requires token revocation
 *        table or changing a per-user token version column).
 *
 * 5. SECURITY:
 *      - The reset token is single-use by design (verified via OTP which was
 *        already marked used in verify-otp.js).
 *      - Minimum password length: 6 characters (enforced here AND on the client).
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
    message: 'Password reset is not yet configured.',
  });

  /* ── REAL IMPLEMENTATION (uncomment and complete) ──────────────
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'Reset token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // 1. Verify reset token
    let payload;
    try {
      payload = jwt.verify(
        resetToken,
        process.env.OTP_RESET_SECRET || process.env.JWT_SECRET
      );
    } catch {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    const userId = payload.userId;

    // 2. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 3. Update users table
    const pool = await connect();
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId]
    );

    // 4. Clean up any remaining OTPs
    await pool.query(
      `UPDATE otp_requests SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [userId]
    );

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('reset-password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
  ────────────────────────────────────────────────────────────── */
}
