/**
 * API ROUTE: POST /api/auth/forgot-password
 * ──────────────────────────────────────────
 * Step 1 of the OTP password-reset flow.
 *
 * REQUEST BODY:
 *   { identifier: string }   — phone, username, reg_no, or national_id
 *
 * SUCCESS RESPONSE (200):
 *   { message: "OTP sent" }
 *   ⚠️  Always return 200 even when the identifier is not found — this
 *       prevents account enumeration attacks.
 *
 * WHAT NEEDS TO BE IMPLEMENTED:
 *
 * 1. DB TABLE — create this migration before enabling the route:
 *      CREATE TABLE IF NOT EXISTS otp_requests (
 *        id          SERIAL PRIMARY KEY,
 *        user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *        otp_hash    TEXT NOT NULL,
 *        expires_at  TIMESTAMPTZ NOT NULL,
 *        used        BOOLEAN NOT NULL DEFAULT FALSE,
 *        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *      );
 *      CREATE INDEX ON otp_requests (user_id, expires_at);
 *
 * 2. SMS GATEWAY — install and configure one of:
 *      a) Twilio:  npm install twilio
 *         const twilio = require('twilio');
 *         const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *         await client.messages.create({ body: `Your OTP: ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: user.phone });
 *
 *      b) Ethio Telecom / local gateway:
 *         Replace with the gateway's REST API using axios or fetch.
 *
 * 3. ENV VARIABLES REQUIRED:
 *      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
 *      TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
 *      TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
 *      JWT_SECRET=...  (already set)
 *
 * 4. RATE LIMITING — add before enabling in production:
 *      npm install express-rate-limit   (or use a Next.js middleware approach)
 *      Limit to e.g. 3 OTP requests per phone per 15 minutes.
 *
 * 5. OTP SECURITY:
 *      - Generate with crypto.randomInt(100000, 999999) — not Math.random().
 *      - Hash the OTP with bcrypt before storing (cost factor 10 is fine).
 *      - Expire after 10 minutes.
 *      - Invalidate any previous unused OTPs for the same user on each new request.
 */


import { connect } from '../../../libs/db';
// import bcrypt from 'bcryptjs';        // uncomment when implementing
// import crypto from 'crypto';          // uncomment when implementing
// import twilio from 'twilio';          // uncomment when implementing

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // ── STUB: remove this block and implement the real logic below ──
  return res.status(503).json({
    message: 'Password reset via SMS is not yet configured. Please contact support.',
  });

  /* ── REAL IMPLEMENTATION (uncomment and complete) ──────────────
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: 'Phone number or username is required.' });
  }

  try {
    const pool = await connect();

    // 1. Look up user
    const result = await pool.query(
      `SELECT id, phone FROM users
       WHERE phone = $1 OR username = $1 OR reg_no = $1 OR national_id = $1
       LIMIT 1`,
      [identifier]
    );

    // 2. If not found, silently succeed (prevent enumeration)
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'If this account exists, an OTP has been sent.' });
    }

    const user = result.rows[0];

    // 3. Generate 6-digit OTP and hash it
    const otp = String(crypto.randomInt(100000, 999999));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Invalidate previous OTPs and insert new one
    await pool.query(
      `UPDATE otp_requests SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [user.id]
    );
    await pool.query(
      `INSERT INTO otp_requests (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, otpHash, expiresAt]
    );

    // 5. Send SMS
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
      body: `Your Awash Insurance password reset code is: ${otp}. Expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone,
    });

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('forgot-password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
  ────────────────────────────────────────────────────────────── */
}
