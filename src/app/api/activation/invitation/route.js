import { NextResponse } from 'next/server';
import { getPool, requireAdmin } from '../../../../libs/serverAuth';
import {
  sha256Hex, hashActivationCode, generateActivationToken, generateActivationCode,
  maskNationalIdTail,
} from '../../../../libs/activation';

const MAX_TOKEN_LIFETIME_MS = 72 * 60 * 60 * 1000;

/**
 * POST /api/activation/invitation  (admin only)
 * Manage a single shareholder's invitation.
 *
 * Body: { userId, action: 'regenerate' | 'invalidate', campaignId? }
 *
 * - regenerate: voids that shareholder's outstanding invitation and issues a
 *   new link + code into the live campaign (returned here in plaintext ONCE —
 *   only hashes are stored, so it can never be recovered afterwards).
 * - invalidate: deletes the outstanding (unverified) invitation. Already
 *   verified/activated invitations are left untouched.
 */
export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  let userId, action, campaignId;
  try {
    const body = await request.json();
    userId = Number(body.userId);
    action = body.action;
    campaignId = Number(body.campaignId) || null;
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ message: 'A valid userId is required' }, { status: 400 });
  }
  if (!['regenerate', 'invalidate'].includes(action)) {
    return NextResponse.json({ message: 'action must be regenerate or invalidate' }, { status: 400 });
  }

  try {
    const pool = getPool();

    const userRes = await pool.query(
      `SELECT id, name, phone, national_id, role, status FROM public.users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ message: 'Shareholder not found' }, { status: 404 });
    }

    // ---------- invalidate ----------
    if (action === 'invalidate') {
      const deleted = await pool.query(
        `DELETE FROM public.activations
         WHERE user_id = $1 AND consumed_at IS NULL AND password_set_at IS NULL
         RETURNING id`,
        [userId]
      );
      if (deleted.rows.length === 0) {
        return NextResponse.json(
          { message: 'No outstanding invitation to invalidate for this shareholder.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        message: `Invitation invalidated for ${user.name || `user #${userId}`}.`,
        invalidated: deleted.rows.length,
      });
    }

    // ---------- regenerate ----------
    if (!['user', 'user2'].includes(user.role)) {
      return NextResponse.json({ message: 'Only shareholder accounts can be invited.' }, { status: 400 });
    }
    if (!user.phone || !user.national_id) {
      return NextResponse.json(
        { message: 'This shareholder is missing a phone number or National ID — fix the record before inviting.' },
        { status: 400 }
      );
    }

    // Target campaign: there is only ever one live campaign, so a single
    // invitation can never be issued into a disabled (or deleted) window
    const campaignRes = campaignId
      ? await pool.query(
        `SELECT id, starts_at, ends_at, status FROM public.activation_campaigns WHERE id = $1 LIMIT 1`,
        [campaignId]
      )
      : await pool.query(
        `SELECT id, starts_at, ends_at, status FROM public.activation_campaigns WHERE status = 'live' LIMIT 1`
      );

    const campaign = campaignRes.rows[0];
    if (!campaign) {
      return NextResponse.json(
        { message: 'There is no live activation campaign. Start one from the Campaign Console first.' },
        { status: 400 }
      );
    }
    if (campaign.status !== 'live') {
      return NextResponse.json(
        { message: `Campaign #${campaign.id} is disabled — enable it before issuing new links.` },
        { status: 409 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const now = Date.now();
    const endsAt = new Date(campaign.ends_at).getTime();
    if (endsAt < now) {
      return NextResponse.json(
        { message: `The activation window of campaign #${campaign.id} has already closed.` },
        { status: 409 }
      );
    }
    const expiresAt = new Date(Math.min(endsAt, now + MAX_TOKEN_LIFETIME_MS));

    const token = generateActivationToken();
    const code = generateActivationCode();
    const tokenHash = sha256Hex(token);
    const codeHash = hashActivationCode(tokenHash, code);
    const link = `${baseUrl}/shareholder/accept-invitation?token=${token}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Void any outstanding invitation for this shareholder, then issue the new one
      await client.query(
        `DELETE FROM public.activations
         WHERE user_id = $1 AND consumed_at IS NULL AND password_set_at IS NULL`,
        [userId]
      );

      const inserted = await client.query(
        `INSERT INTO public.activations (campaign_id, user_id, token_hash, code_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [campaign.id, userId, tokenHash, codeHash, expiresAt]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        message: 'New invitation created. Share the link and code with the shareholder now — they are not recoverable later.',
        activationId: inserted.rows[0].id,
        campaignId: campaign.id,
        link,
        token,
        code,
        expiresAt,
        phone: user.phone,
        name: user.name,
        // The same tail the campaign CSV prints, read off the same row the link and
        // code above were generated for. Masked server-side: the raw National ID
        // never reaches the browser.
        idReference: maskNationalIdTail(user.national_id),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Activation invitation management error:', error);
    return NextResponse.json({ message: 'Failed to manage invitation' }, { status: 500 });
  }
}
