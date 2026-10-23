import crypto from 'crypto';

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}


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
  //return crypto.randomBytes(32).toString('hex');
    return crypto.randomBytes(12).toString('base64url');
}


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
