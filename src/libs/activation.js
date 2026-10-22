import crypto from 'crypto';

/**
 * Shared helpers for the shareholder activation flow.
 *
 * Used by BOTH /api/activation/campaign (generation) and
 * /api/activation/verify (checking) so the two sides can never drift apart — and
 * by the single re-issue endpoint, so the wording an admin sees for one
 * shareholder is exactly what the campaign CSV says for all of them.
 */

/** Plain SHA-256 hex digest (used for the activation link token). */
export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/**
 * Hash a verification code *bound to its activation link*.
 *
 * The code digest is an HMAC keyed with the row's token hash, so a code is only
 * ever valid together with the exact link it was issued for:
 *   - user A's link + user B's code  → different key   → fails
 *   - a code_hash copied to another row → no longer matches its new key → fails
 *   - identical codes across rows produce different digests (key acts as salt)
 */
export function hashActivationCode(tokenHash, code) {
  return crypto
    .createHmac('sha256', Buffer.from(String(tokenHash), 'utf8'))
    .update(String(code))
    .digest('hex');
}

/** Constant-time comparison of two hex digests (no length/content early exit). */
export function timingSafeHexEqual(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Random 64-char (256-bit) activation link token. */
export function generateActivationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Tail-only reference to a shareholder's National ID, e.g. `****3457`.
 *
 * One phone number routinely carries several shareholder accounts (120 accounts
 * on 51 numbers today), and an invitation SMS says nothing about which account it
 * belongs to. Four characters of the National ID are enough for the recipient to
 * tell the messages apart while revealing nothing usable on their own.
 *
 * Deliberately string-only. Stored National IDs run up to 17 characters and
 * usually 16, so Number()/parseInt() would silently rewrite the trailing digits
 * (anything above 9007199254740991 loses precision) and drop the leading zeros a
 * quarter of the 10-digit records carry. Only separators are removed — not a
 * single digit or letter — so the printed tail is always an exact substring of
 * what is stored, and the four leading `*` are fixed rather than proportional so
 * the message never leaks how long the number is.
 *
 * Returns null when there is nothing safe to show: no ID at all, or an ID short
 * enough that "masking" it would print the entire number.
 */
export function maskNationalIdTail(value) {
  if (value === null || value === undefined) return null;
  const chars = String(value).replace(/[^0-9A-Za-z]/g, '');
  if (chars.length < 5) return null;
  return `****${chars.slice(-4)}`;
}

/** Random, unguessable 6-digit verification code. */
export function generateActivationCode() {
  return String(crypto.randomInt(100000, 1000000));
}
