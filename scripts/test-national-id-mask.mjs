// National ID tail masking + how it lands in the campaign CSV.
// Run: node scripts/test-national-id-mask.mjs
//
// generateInvitations() is driven by a fake pg client, so this never touches the
// database — no invitation is issued or voided by running it.
import { maskNationalIdTail, sha256Hex } from '../src/libs/activation.js';
import { generateInvitations } from '../src/libs/activationCampaign.js';

let failed = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} -> ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`);
};

console.log('--- maskNationalIdTail: no digit truncated, no numeric coercion ---');
// Beyond Number.MAX_SAFE_INTEGER (9007199254740991): Number() rewrites the very
// digits being printed. 2^53+1 and sixteen nines are the classic cases.
check('2^53+1 keeps its true tail', maskNationalIdTail('9007199254740993'), '****0993');
check('16 nines not rounded up', maskNationalIdTail('9999999999999999'), '****9999');
check('17-digit value intact', maskNationalIdTail('12345678901234567'), '****4567');
check('24-digit value never exponential', maskNationalIdTail('9999999999999999999999'), '****9999');
// Leading zeros: Number() collapses these below the 5-character floor and the
// reference would silently disappear.
check('leading zeros preserved', maskNationalIdTail('000012'), '****0012');
check('zeros inside the tail window', maskNationalIdTail('012345670012'), '****0012');
check('16-digit ID with leading zeros', maskNationalIdTail('0012345678901234'), '****1234');
check('typical 10-digit ID starting with 0', maskNationalIdTail('0123456789'), '****6789');
// Separators are dropped without shifting a single digit off the tail.
check('spaces and dashes stripped only', maskNationalIdTail('1234 5678-90'), '****7890');
check('letters kept in order', maskNationalIdTail('AB12CD34EF'), '****34EF');
check('typical 16-digit ID', maskNationalIdTail('1201234567890345'), '****0345');

console.log('\n--- nothing safe to show => no reference, never the whole ID ---');
check('4-char ID would be fully exposed', maskNationalIdTail('1234'), null);
check('empty string', maskNationalIdTail(''), null);
check('whitespace only', maskNationalIdTail('   '), null);
check('null', maskNationalIdTail(null), null);
check('undefined', maskNationalIdTail(undefined), null);
check('non-string that coercion would mangle', maskNationalIdTail(1e21), null);

console.log('\n--- every printed tail is an exact substring of the stored ID ---');
for (const id of ['9007199254740993', '000012', '1234 5678-90', 'AB12CD34EF', '0123456789']) {
  const ref = maskNationalIdTail(id);
  const tail = ref.slice(4);
  const digitsOnly = id.replace(/[^0-9A-Za-z]/g, '');
  const inOrder = digitsOnly.endsWith(tail) && tail.length === 4;
  check(`${id} -> tail is the real ending`, inOrder, true);
}

console.log('\n--- campaign CSV: one reference per shareholder, bound to their own row ---');
const SAMPLES = [
  { id: 11, phone: '0911234567', national_id: '9007199254740993' },
  { id: 12, phone: '0911234567', national_id: '1234567890123456' }, // same phone, different account
  { id: 13, phone: '+251911234567', national_id: '0123456789' },   // third account on that phone
  { id: 14, phone: '0922334455', national_id: '7777888899990000' }, // phone nobody shares: still referenced
  { id: 15, phone: '0933445566', national_id: '1234' },           // degenerate: clause must vanish
];

let insertParams = null;
const fakeClient = {
  async query(sql, params) {
    if (sql.includes('FROM public.users u')) return { rows: SAMPLES };
    if (sql.includes('INSERT INTO public.activations')) insertParams = params;
    return { rows: [] };
  },
};

const { count, csv } = await generateInvitations(fakeClient, {
  campaignId: 1,
  endsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  baseUrl: 'http://10.1.12.90:3000',
});
const rows = csv.split('\n').slice(1);

check('one CSV row per shareholder', count, SAMPLES.length);
check('row count matches CSV', rows.length, SAMPLES.length);

// Row i of the CSV, user i of the SELECT and position i of the bulk INSERT are the
// same shareholder: prove the link printed on a line is the digest stored for the
// user named at that position, and that the reference quoted there is that user's.
const [campaignId, userIds, tokenHashes, codeHashes] = insertParams;
check('campaign id passed to the INSERT', campaignId, 1);
check('one code digest per user', codeHashes.length, SAMPLES.length);

SAMPLES.forEach((user, i) => {
  const line = rows[i];
  const expected = maskNationalIdTail(user.national_id);
  const printedToken = line.match(/token=([0-9a-f]{64})/)[1];
  check(`${user.id}: INSERT position ${i} is user ${user.id}`, userIds[i], user.id);
  check(`${user.id}: link on line ${i} hashes to the digest stored for user ${user.id}`, tokenHashes[i], sha256Hex(printedToken));
  if (expected === null) {
    check(`${user.id}: too short to mask, so no reference clause at all`, line.includes('Reference') || line.includes('****'), false);
    check(`${user.id}: message still reads as one sentence`, line.includes(`Do not share this code."`), true);
    return;
  }
  check(`${user.id}: its own reference on its own line`, line.includes(`Reference ${expected}.`), true);
});

check('every row carries a 6-digit code', rows.every((l) => /Verification code: \d{6}\./.test(l)), true);
check('shared phone numbers normalise identically', new Set(rows.slice(0, 3).map((l) => l.split(',')[0])).size, 1);
check('three accounts on that phone get three distinct references', new Set(rows.slice(0, 3).map((l) => l.match(/Reference (\*{4}\w{4})/)[1])).size, 3);

console.log('\n--- no full National ID anywhere in the export ---');
for (const user of SAMPLES) {
  const full = user.national_id.replace(/[^0-9A-Za-z]/g, '');
  if (full.length > 4) check(`${user.id}: ${full.slice(0, 4)}… not in CSV`, csv.includes(full), false);
}
check('masked tails do appear', csv.includes('****0993'), true);
check('unshared phone also gets a reference', rows[3].includes('Reference ****0000.'), true);
check('fixed-width mask, length not leaked', (csv.match(/\*{4}/g) || []).length, 4);

console.log('\n--- sample message as the SMS gateway receives it ---');
console.log(rows[1].split(',').slice(1).join(',').replace(/^"|"$/g, ''));

console.log(failed === 0 ? '\nAll masking checks passed.' : `\n${failed} check(s) FAILED`);
process.exit(failed === 0 ? 0 : 1);
