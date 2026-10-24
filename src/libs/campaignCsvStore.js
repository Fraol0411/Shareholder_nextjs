import fs from 'fs/promises';
import path from 'path';

/**
 * Server-side copy of each campaign SMS CSV (links/codes are not stored in PostgreSQL).
 * Defaults to <cwd>/.data/campaign-csv (works for local dev). In containerized
 * deployments point CAMPAIGN_CSV_DIR at a writable, persisted volume path.
 */
const ROOT = process.env.CAMPAIGN_CSV_DIR
  ? path.resolve(process.env.CAMPAIGN_CSV_DIR)
  : path.join(process.cwd(), '.data', 'campaign-csv');

function filePath(campaignId) {
  return path.join(ROOT, `${campaignId}.csv`);
}

export async function saveCampaignCsv(campaignId, csv) {
  if (!csv?.trim()) return;
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(filePath(campaignId), csv, 'utf8');
}

export async function loadCampaignCsv(campaignId) {
  try {
    const csv = await fs.readFile(filePath(campaignId), 'utf8');
    if (!csv.trim()) return null;
    const count = Math.max(0, csv.trim().split('\n').length - 1);
    return { csv, count };
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function deleteCampaignCsv(campaignId) {
  try {
    await fs.unlink(filePath(campaignId));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
