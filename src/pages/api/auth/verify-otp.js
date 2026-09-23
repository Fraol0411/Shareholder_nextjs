import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = 'shareholder@awash';
const OTP_MAX_FAILED_ATTEMPTS = 5;
const OTP_LOCK_MINUTES = 15;

function phoneVariants(input) {
  const digits = String(input).replace(/\D/g, '');
  const local = digits.startsWith('251') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  return [local, `0${local}`, `251${local}`];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, otp, newPassword } = req.body || {};
  const trimmedPhone = (phone || '').trim();
  const trimmedOtp = String(otp || '').trim();

  if (!trimmedPhone || !trimmedOtp || !newPassword) return res.status(400).json({ message: 'Phone number, OTP and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  if (newPassword === DEFAULT_PASSWORD) return res.status(400).json({ message: 'New password must be different from the default password' });

  try {
    const pool = await connect();
    const userRes = await pool.query(
      `SELECT id, otp, otp_expires_at, otp_failed_attempts, otp_locked_until
       FROM users WHERE phone = ANY($1) LIMIT 1`,
      [phoneVariants(trimmedPhone)]
    );

    if (userRes.rows.length === 0) return res.status(404).json({ message: 'No account found for this phone number.' });

    const user = userRes.rows[0];
    const now = Date.now();

    if (user.otp_locked_until) {
      const lockedUntil = new Date(user.otp_locked_until).getTime();
      if (lockedUntil > now) {
        const retryAfter = Math.ceil((lockedUntil - now) / 1000);
        return res.status(423).json({
          code: 'OTP_LOCKED',
          message: `Too many incorrect attempts. Verification is locked. Request a new code or wait ${Math.ceil(retryAfter / 60)} minute(s).`,
          retryAfter,
          lockedUntil: new Date(lockedUntil).toISOString(),
        });
      }
      await pool.query('UPDATE users SET otp_locked_until = NULL, otp_failed_attempts = 0 WHERE id = $1', [user.id]);
    }

    if (!user.otp) return res.status(400).json({ code: 'OTP_MISSING', message: 'No pending verification. Please request a new code.' });

    if (!user.otp_expires_at || new Date(user.otp_expires_at).getTime() < now) {
      await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE id = $1', [user.id]);
      return res.status(400).json({ code: 'OTP_EXPIRED', message: 'OTP expired. Please request a new code.' });
    }

    if (user.otp !== trimmedOtp) {
      const attempts = (user.otp_failed_attempts || 0) + 1;
      const remaining = OTP_MAX_FAILED_ATTEMPTS - attempts;

      if (remaining <= 0) {
        const lockedUntil = new Date(now + OTP_LOCK_MINUTES * 60 * 1000);
        await pool.query(
          `UPDATE users SET otp_failed_attempts = 0, otp_locked_until = $1, otp = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [lockedUntil, user.id]
        );
        return res.status(423).json({
          code: 'OTP_LOCKED',
          message: `Too many incorrect attempts. For your security, verification is locked for ${OTP_LOCK_MINUTES} minutes. Request a new code to unlock.`,
          retryAfter: OTP_LOCK_MINUTES * 60,
          lockedUntil: lockedUntil.toISOString(),
        });
      }

      await pool.query('UPDATE users SET otp_failed_attempts = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [attempts, user.id]);
      return res.status(400).json({
        code: 'OTP_INVALID',
        message: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      `UPDATE users SET password_hash = $1, otp = NULL, otp_expires_at = NULL, otp_failed_attempts = 0, otp_locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, user.id]
    );

    return res.status(200).json({ message: 'Password set successfully. You can now sign in.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}