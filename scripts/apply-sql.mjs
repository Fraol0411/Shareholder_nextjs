// Apply a .sql migration file against DATABASE_URL.
//   node scripts/apply-sql.mjs scripts/data_access_settings_migration.sql
// Next.js loads .env for the app itself; a standalone script has to do it here
// because the project has no dotenv dependency.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const env = readFileSync(resolve(root, '.env'), 'utf8')
  .split(/\r?\n/)
  .reduce((acc, line) => {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match) acc[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    return acc;
  }, {});

const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set (checked process.env and .env).');
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/apply-sql.mjs <path-to-sql-file>');
  process.exit(1);
}

const sql = readFileSync(resolve(root, file), 'utf8');
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${file}`);
} catch (error) {
  console.error(`Failed to apply ${file}:`, error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
