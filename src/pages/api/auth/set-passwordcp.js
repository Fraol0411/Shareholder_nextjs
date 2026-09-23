import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendOtpSms } from '../../../libs/sms';

const DEFAULT_PASSWORD = 'shareholder@awash';
const OTP_TTL_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_PER_24H = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function phoneVariants(input) {
  const digits = String(input).replace(/\D/g, '');
  const local = digits.startsWith('251') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return [local, `0${local}`, `251${local}`];
}

export default async function handler(req, res) {
  // --- GET: Return OTP Status (for frontend sync) ---
  if (req.method === 'GET') {
    const phone = String(req.query.phone || '').trim();
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    try {
      const pool = await connect();
      const userRes = await pool.query(
        `SELECT otp, otp_last_sent_at, otp_24h_count, otp_window_start, otp_failed_attempts, otp_locked_until
         FROM users WHERE phone = ANY($1) LIMIT 1`,
        [phoneVariants(phone)]
      );
      if (userRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });

      const u = userRes.rows[0];
      const now = Date.now();

      let cooldown = 0;
      if (u.otp_last_sent_at) {
        const elapsed = now - new Date(u.otp_last_sent_at).getTime();
        if (elapsed < OTP_COOLDOWN_SECONDS * 1000) {
          cooldown = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
        }
      }

      let windowStart = u.otp_window_start ? new Date(u.otp_window_start).getTime() : null;
      let count = u.otp_24h_count || 0;
      if (!windowStart || now - windowStart >= WINDOW_MS) { windowStart = now; count = 0; }

      let lockSeconds = 0;
      if (u.otp_locked_until) {
        const until = new Date(u.otp_locked_until).getTime();
        if (until > now) lockSeconds = Math.ceil((until - now) / 1000);
      }

      return res.status(200).json({
        cooldown,
        remainingIn24h: Math.max(0, OTP_MAX_PER_24H - count),
        hasPendingOtp: !!u.otp,
        lockSeconds,
        failedAttempts: u.otp_failed_attempts || 0,
        maxFailedAttempts: 5,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // --- POST: Request OTP ---
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, newPassword } = req.body || {};
  const trimmedPhone = (phone || '').trim();

  if (!trimmedPhone || !newPassword) return res.status(400).json({ message: 'Phone number and new password are required' });
  if (!/^\+?\d+$/.test(trimmedPhone)) return res.status(400).json({ message: 'Phone number must contain digits only' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  if (newPassword === DEFAULT_PASSWORD) return res.status(400).json({ message: 'New password must be different from the default password' });

  try {
    const pool = await connect();
    const userRes = await pool.query(
      `SELECT id, phone, password_hash, otp_last_sent_at, otp_24h_count, otp_window_start, otp_locked_until
       FROM users WHERE phone = ANY($1) LIMIT 1`,
      [phoneVariants(trimmedPhone)]
    );

    if (userRes.rows.length === 0) return res.status(404).json({ message: 'No account found for this phone number.' });

    const user = userRes.rows[0];
    const now = Date.now();

    // 1. 60s Cooldown Check
    if (user.otp_last_sent_at) {
      const elapsed = now - new Date(user.otp_last_sent_at).getTime();
      if (elapsed < OTP_COOLDOWN_SECONDS * 1000) {
        const retryAfter = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - elapsed) / 1000);
        return res.status(429).json({ code: 'OTP_COOLDOWN', message: `Please wait ${retryAfter} seconds before requesting a new code.`, retryAfter });
      }
    }

    // 2. 24h Window Check
    let windowStart = user.otp_window_start ? new Date(user.otp_window_start).getTime() : null;
    let count24h = user.otp_24h_count || 0;

    if (!windowStart || now - windowStart >= WINDOW_MS) {
      windowStart = now;
      count24h = 0;
    }

    if (count24h >= OTP_MAX_PER_24H) {
      const resetsInMs = windowStart + WINDOW_MS - now;
      const retryAfter = Math.ceil(resetsInMs / 1000);
      const hoursLeft = Math.ceil(resetsInMs / (60 * 60 * 1000));
      return res.status(429).json({ code: 'OTP_LIMIT_24H', message: `Maximum OTP requests reached for today. Try again in about ${hoursLeft} hour(s).`, retryAfter });
    }

    // 3. Default Password Check
    const isDefaultPassword = await bcrypt.compare(DEFAULT_PASSWORD, user.password_hash);
    if (!isDefaultPassword) {
      return res.status(403).json({ code: 'PASSWORD_ALREADY_SET', message: 'Your password has already been changed. Please sign in normally.' });
    }


    
    // 4. Generate & Send OTP
    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(now + OTP_TTL_MINUTES * 60 * 1000);

    try {
      await sendOtpSms(user.phone || trimmedPhone, otp);
    } catch (smsError) {
      console.error('SMS send error:', smsError);
      // 👇 RETURN THE ACTUAL ERROR MESSAGE INSTEAD OF THE GENERIC ONE
      return res.status(502).json({ 
        message: `SMS Gateway Error: ${smsError.message}` 
      });
    }

    // 5. Update DB
    await pool.query(
      `UPDATE users
       SET otp = $1,
           otp_expires_at = $2,
           otp_last_sent_at = $3,
           otp_window_start = $4,
           otp_24h_count = $5,
           otp_failed_attempts = 0,
           otp_locked_until = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [otp, expiresAt, new Date(now), new Date(windowStart), count24h + 1, user.id]
    );

    return res.status(200).json({
      message: 'OTP sent to your phone number.',
      otpSent: true,
      cooldown: OTP_COOLDOWN_SECONDS,
      remainingIn24h: OTP_MAX_PER_24H - (count24h + 1),
    });
  } catch (error) {
    console.error('Set password (OTP request) error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}