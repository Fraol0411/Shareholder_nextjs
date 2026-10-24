'use client';

import { useCallback, useState } from 'react';
import { getToken } from '../libs/auth';

/** Trigger a browser download for a CSV response (already-read headers + body). */
async function saveCsv(response, fallbackName) {
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] || fallbackName;

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function readError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  throw Object.assign(new Error(data.message || fallback), { status: response.status });
}

/**
 * Client-side actions for the single activation campaign:
 * create (CSV download), re-issue (fresh CSV), disable, enable, delete.
 * Shared by the Campaign Console and the Activation Dashboard so both surfaces
 * talk to /activation/campaign the same way.
 */
export function useCampaignActions() {
  const [isActing, setIsActing] = useState(false);

  /** POST/PATCH that answer with a CSV — returns { campaignId, count }. */
  const runCsvAction = useCallback(async (method, body, fallbackName) => {
    const res = await fetch('/activation/campaign', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) await readError(res, 'Request failed');

    await saveCsv(res, fallbackName);
    return {
      campaignId: res.headers.get('X-Campaign-Id') || '',
      count: Number(res.headers.get('X-Invitation-Count')) || 0,
    };
  }, []);

  const createCampaign = useCallback(
    ({ startsAt, endsAt }) =>
      runCsvAction('POST', { startsAt, endsAt }, `activation_campaign_${new Date().toISOString().slice(0, 10)}.csv`),
    [runCsvAction]
  );

  const reissueCampaign = useCallback(
    (campaignId, { deliverCsv = true } = {}) => {
      if (deliverCsv) {
        return runCsvAction(
          'PATCH',
          { campaignId, action: 'reissue', deliverCsv: true },
          `activation_campaign_${campaignId}_reissued.csv`
        );
      }
      return (async () => {
        const res = await fetch('/activation/campaign', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ campaignId, action: 'reissue', deliverCsv: false }),
        });
        if (!res.ok) await readError(res, 'Failed to re-issue campaign');
        return res.json();
      })();
    },
    [runCsvAction]
  );

  const downloadCampaignCsv = useCallback(async (campaignId) => {
    const res = await fetch('/activation/campaign', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ campaignId, action: 'download' }),
    });
    if (!res.ok) await readError(res, 'Failed to download CSV');
    await saveCsv(res, `activation_campaign_${campaignId}.csv`);
    return {
      campaignId,
      count: Number(res.headers.get('X-Invitation-Count')) || 0,
    };
  }, []);

  const disableCampaign = useCallback(async (campaignId) => {
    const res = await fetch('/activation/campaign', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ campaignId, action: 'disable' }),
    });
    if (!res.ok) await readError(res, 'Failed to disable campaign');
    return res.json();
  }, []);

  const enableCampaign = useCallback(async (campaignId) => {
    const res = await fetch('/activation/campaign', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ campaignId, action: 'enable' }),
    });
    if (!res.ok) await readError(res, 'Failed to enable campaign');
    return res.json();
  }, []);

  const deleteCampaign = useCallback(async (campaignId, confirm) => {
    const res = await fetch('/activation/campaign', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ campaignId, confirm }),
    });
    if (!res.ok) await readError(res, 'Failed to delete campaign');
    return res.json();
  }, []);

  /** Wrap an action so the caller gets a single busy flag and error message. */
  const act = useCallback(async (fn) => {
    setIsActing(true);
    try {
      return await fn();
    } finally {
      setIsActing(false);
    }
  }, []);

  return {
    isActing,
    act,
    createCampaign,
    reissueCampaign,
    downloadCampaignCsv,
    disableCampaign,
    enableCampaign,
    deleteCampaign,
  };
}
