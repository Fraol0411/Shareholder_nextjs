import { sha256Hex, hashActivationCode, timingSafeHexEqual, generateActivationToken, generateActivationCode } from '../src/libs/activation.js';

// Two shareholders, two links, two codes
const userA = { token: generateActivationToken(), code: generateActivationCode() };
const userB = { token: generateActivationToken(), code: generateActivationCode() };

// What the DB stores per activation row
const rowA = { tokenHash: sha256Hex(userA.token), codeHash: hashActivationCode(sha256Hex(userA.token), userA.code) };
const rowB = { tokenHash: sha256Hex(userB.token), codeHash: hashActivationCode(sha256Hex(userB.token), userB.code) };

// What verify() computes: lookup row by submitted token, then check code against that row
const check = (submittedToken, submittedCode, storedRow) =>
  timingSafeHexEqual(hashActivationCode(sha256Hex(submittedToken), submittedCode), storedRow.codeHash);

const results = [
  ['A link + A code + A row (correct)', check(userA.token, userA.code, rowA), true],
  ['A link + B code (crossed codes)', check(userA.token, userB.code, rowA), false],
  ['B link + A code (crossed codes)', check(userB.token, userA.code, rowB), false],
  ['A link + A code against B row (stolen link)', check(userA.token, userA.code, rowB), false],
  ['Attacker guesses a code on A link', check(userA.token, '000000', rowA), false],
  ['code_hash copied between rows is useless', check(userB.token, userA.code, { codeHash: rowA.codeHash }), false],
];

let failed = 0;
for (const [name, actual, expected] of results) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} -> ${actual}`);
}
console.log(failed === 0 ? '\nAll binding checks passed.' : `\n${failed} check(s) FAILED`);
