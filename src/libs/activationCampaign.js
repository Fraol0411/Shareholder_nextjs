import {
  sha256Hex, hashActivationCode, generateActivationToken, generateActivationCode,
  maskNationalIdTail,
} from './activation.js';

export const MAX_TOKEN_LIFETIME_MS = 72 * 60 * 60 * 1000; // links/codes live at most 72h

/** Local (09XXXXXXXX) or already-international numbers → E.164 without the plus. */
export function toInternationalPhone(phone) {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `251${digits.slice(1)}`;
  else if (digits.length === 9 && !digits.startsWith('251')) digits = `251${digits}`;
  return digits;
}

/**
 * Shareholders who can receive an activation link for a given campaign:
 * portal shareholder accounts with a phone AND a National ID/TIN, not locked or
 * disabled, and not already activated inside this campaign.
 */
const INVITABLE_PREDICATE = `
  u.role IN ('user', 'user2')
  AND u.phone IS NOT NULL AND u.phone <> ''
  AND u.national_id IS NOT NULL AND u.national_id <> ''
  AND u.status IN ('pending', 'active')
  AND NOT EXISTS (
    SELECT 1 FROM public.activations a
    WHERE a.campaign_id = $1 AND a.user_id = u.id AND a.password_set_at IS NOT NULL
  )`;

export async function listInvitableUsers(client, campaignId) {
  const result = await client.query(
    `SELECT u.id, u.phone, u.national_id
     FROM public.users u
     WHERE ${INVITABLE_PREDICATE}
     ORDER BY u.id`,
    [campaignId]
  );
  return result.rows;
}

/** How many shareholders an invitation could be issued for right now. */
export async function countInvitableUsers(client, campaignId) {
  const result = await client.query(
    `SELECT count(*)::int AS inviteable
     FROM public.users u
     WHERE ${INVITABLE_PREDICATE}`,
    [campaignId]
  );
  return result.rows[0].inviteable;
}

/**
 * Issue a fresh unique link + code for every invitable shareholder of a campaign.
 *
 * Must run inside a transaction. Only SHA-256/HMAC digests are stored — the raw
 * token (link) and the 6-digit code exist only in the returned CSV, so the CSV
 * can never be rebuilt later. Any still-outstanding invitation of the SAME
 * campaign is replaced (older campaigns are left untouched and stay inert while
 * disabled, because at most one campaign can be live).
 *
 * Returns { count, csv, expiresAt } — count 0 means nothing was issued.
 */
export async function generateInvitations(client, { campaignId, endsAt, baseUrl }) {
  const users = await listInvitableUsers(client, campaignId);
  if (users.length === 0) {
    return { count: 0, csv: '', expiresAt: null };
  }

  // Void this campaign's outstanding (never-verified) invitations
  await client.query(
    `DELETE FROM public.activations
     WHERE campaign_id = $1 AND consumed_at IS NULL AND password_set_at IS NULL`,
    [campaignId]
  );

  const expiresAt = new Date(Math.min(new Date(endsAt).getTime(), Date.now() + MAX_TOKEN_LIFETIME_MS));
  const userIds = [];
  const tokenHashes = [];
  const codeHashes = [];
  const csvRows = [];

  for (const user of users) {
    const token = generateActivationToken();
    const code = generateActivationCode();
    const tokenHash = sha256Hex(token);

    userIds.push(user.id);
    tokenHashes.push(tokenHash);
    // Code digest is keyed by this row's token hash: link and code are bound to
    // each other and to exactly one shareholder.
    codeHashes.push(hashActivationCode(tokenHash, code));

    const link = `${baseUrl}/shareholder/accept-invitation?token=${token}`;
    // Every invitation carries the reference, not just the ones whose phone number
    // happens to be shared — one consistent sentence for all 1,500-odd messages
    // means staff and shareholders learn one thing, and a phone that gains a
    // second account later does not start receiving oddly different SMS.
    // Computed from THIS user row, alongside their token and code, so a reference
    // can never end up on another shareholder's message.
    const reference = maskNationalIdTail(user.national_id);
    const message =
      `Awash Insurance: Activate your shareholder account via this link: ${link} ` +
      `Verification code: ${code}. Valid until ${expiresAt.toLocaleDateString('en-GB')}. ` +
      `${reference ? `Reference ${reference}. ` : ''}Do not share this code.`;
    csvRows.push({ phone: toInternationalPhone(user.phone), message });
  }

  await client.query(
    `INSERT INTO public.activations (campaign_id, user_id, token_hash, code_hash, expires_at)
     SELECT $1, unnest($2::int[]), unnest($3::text[]), unnest($4::text[]), $5`,
    [campaignId, userIds, tokenHashes, codeHashes, expiresAt]
  );

  const csv =
    'phone_number,message\n' +
    csvRows.map((row) => `${row.phone},"${row.message.replace(/"/g, '""')}"`).join('\n');

  return { count: csvRows.length, csv, expiresAt };
}

/** Campaign CSV as an HTTP response (browsers download it directly). */
export function csvResponse(csv, campaignId, headers = {}) {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="activation_campaign_${campaignId}.csv"`,
      ...headers,
    },
  });
}
