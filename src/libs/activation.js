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

/**
 * Activation link tokens: 16 characters drawn from letters and digits only.
 * Restricting the alphabet keeps the link safe to paste into SMS, into a CSV for
 * the gateway and into any browser, while staying unguessable (~6 bits per
 * character, so ~95 bits of entropy per token).
 */
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_LENGTH = 16;

export function generateActivationToken() {
  let token = '';
  for (let i = 0; i < TOKEN_LENGTH; i += 1) {
    // crypto.randomInt draws uniformly from the range, so no character is favoured
    token += TOKEN_ALPHABET[crypto.randomInt(0, TOKEN_ALPHABET.length)];
  }
  return token;
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
