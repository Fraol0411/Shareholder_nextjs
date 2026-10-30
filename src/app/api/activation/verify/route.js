import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getPool, getJwtSecret } from '../../../../libs/serverAuth';
import { sha256Hex, hashActivationCode, timingSafeHexEqual } from '../../../../libs/activation';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SETUP_TOKEN_MINUTES = 10;

// One generic failure message for every rejection path (no enumeration leaks)
const GENERIC_FAILURE = 'The activation link or verification details are not valid.';

/**
 * POST /api/activation/verify
 * Body: { token, nationalId, code }
 *
 * Validates the unique activation token + shareholder national ID + code,
 * enforces the campaign window, expiry and lockout, then issues a short-lived
 * purpose-restricted password-setup token. Verifying no longer burns the link:
 * it can be repeated until the password is actually set.
 */
export async function POST(request) {
  let token, nationalId, code;
  try {
    const body = await request.json();
    token = String(body.token || '').trim();
    nationalId = String(body.nationalId || '').trim();
    code = String(body.code || '').trim();
  } catch {
    return NextResponse.json({ message: GENERIC_FAILURE }, { status: 400 });
  }

  if (!token || !/^\d+$/.test(nationalId) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: GENERIC_FAILURE }, { status: 400 });
  }

  try {
    const pool = getPool();
    const candidateTokenHash = sha256Hex(token);

    const result = await pool.query(
      `SELECT a.id, a.user_id, a.code_hash, a.expires_at, a.consumed_at, a.password_set_at,
              a.failed_attempts, a.locked_until,
              c.starts_at, c.ends_at, c.status AS campaign_status,
              u.national_id, u.status AS user_status
       FROM public.activations a
       JOIN public.activation_campaigns c ON c.id = a.campaign_id
       JOIN public.users u ON u.id = a.user_id
       WHERE a.token_hash = $1
       LIMIT 1`,
      [candidateTokenHash]
    );

    const activation = result.rows[0];
    if (!activation) {
      return NextResponse.json({ message: GENERIC_FAILURE }, { status: 400 });
    }

    const now = Date.now();

    // Lockout after repeated failures
    if (activation.locked_until && new Date(activation.locked_until).getTime() > now) {
      return NextResponse.json(
        { message: 'Too many incorrect attempts. Please try again later or contact support.', retryAfter: Math.ceil((new Date(activation.locked_until).getTime() - now) / 1000) },
        { status: 423 }
      );
    }

    // A shareholder who already finished activation must not be run through a
    // form that can never succeed: holding this unguessable link is proof enough
    // to say "your account is active, please sign in". No account data is shared.
    if (activation.password_set_at) {
      return NextResponse.json(
        {
          alreadyActivated: true,
          message: 'This activation link has already been used — your account is active.',
          redirectSeconds: 10,
        },
        { status: 409 }
      );
    }

    // Window / campaign state / expiry checks. A verified-but-not-completed link
    // stays reusable — having already verified (consumed_at) is NOT a rejection
    // reason here. A disabled campaign stops every one of its links at once, and
    // an enabled one resumes them — no invitation is deleted either way.
    const campaignLive = activation.campaign_status === 'live';
    const windowOpen = now >= new Date(activation.starts_at).getTime() && now <= new Date(activation.ends_at).getTime();
    const notExpired = new Date(activation.expires_at).getTime() > now;
    if (!campaignLive || !windowOpen || !notExpired || activation.user_status === 'locked' || activation.user_status === 'disabled') {
      return NextResponse.json({ message: GENERIC_FAILURE }, { status: 400 });
    }

    // Code + national ID verification (compared without revealing which failed).
    // The expected digest is derived with THIS link's token hash as the HMAC key,
    // so a code is only ever valid for the exact activation link it was issued for.
    const expectedCodeHash = hashActivationCode(candidateTokenHash, code);
    const codeOk = timingSafeHexEqual(expectedCodeHash, activation.code_hash);
    const idOk = String(activation.national_id || '').trim() === nationalId;

    if (!codeOk || !idOk) {
      const attempts = (activation.failed_attempts || 0) + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await pool.query(
          `UPDATE public.activations
           SET failed_attempts = 0, locked_until = $1
           WHERE id = $2`,
          [new Date(now + LOCK_MINUTES * 60 * 1000), activation.id]
        );
        return NextResponse.json(
          { message: 'Too many incorrect attempts. Verification is temporarily locked. Please try again later.' },
          { status: 423 }
        );
      }
      await pool.query(
        `UPDATE public.activations SET failed_attempts = $1 WHERE id = $2`,
        [attempts, activation.id]
      );
      return NextResponse.json(
        { message: GENERIC_FAILURE, attemptsRemaining: MAX_FAILED_ATTEMPTS - attempts },
        { status: 400 }
      );
    }

    // Record the identity check, but do NOT burn the link. A shareholder who
    // verifies and then walks away (setup session times out, closes the tab,
    // stops before setting a password) can come back and verify again with the
    // same code. Only setting the password (password_set_at) finalizes the link,
    // and the activation's validity date (expires_at) still bounds it above.
    await pool.query(
      `UPDATE public.activations
       SET consumed_at = COALESCE(consumed_at, NOW())
       WHERE id = $1`,
      [activation.id]
    );

    // Short-lived, purpose-restricted password-setup capability
    const setupToken = jwt.sign(
      { userId: activation.user_id, activationId: activation.id, purpose: 'password-setup' },
      getJwtSecret(),
      { expiresIn: `${SETUP_TOKEN_MINUTES}m` }
    );

    return NextResponse.json({
      message: 'Identity verified. Please set your password to complete activation.',
      setupToken,
      expiresInSeconds: SETUP_TOKEN_MINUTES * 60,
    });
  } catch (error) {
    console.error('Activation verify error:', error);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
