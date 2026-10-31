'use client';

import { useEffect, useState } from 'react';
import { getToken } from '../libs/auth';

const OPEN = { loading: false, enabled: true, notice: null, note: '' };

/**
 * The state of the shareholder data-viewing switch, for the parts of the portal
 * that have to know it before a page is opened: the header hides the links that
 * lead to dividend data, and the home dashboard shows the notice instead of the
 * services.
 *
 * It fails open on any problem. Enforcement lives server-side in
 * requireDividendDataAccess(), so a status that cannot be read must not empty the
 * portal of its navigation — the pages themselves still explain a closed switch.
 *
 * @param {{ skip?: boolean }} skip true for accounts the switch does not apply to
 *   (staff and admin), which then never make the request.
 */
export function useDividendAccessState({ skip = false } = {}) {
  // While the first read is in flight the portal looks open, which is what a
  // shareholder would otherwise see anyway.
  const [state, setState] = useState(() => (skip ? OPEN : { ...OPEN, loading: true }));

  useEffect(() => {
    if (skip) {
      setState(OPEN);
      return;
    }

    let ignore = false;

    const read = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/data-access/status`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        // Only a readable answer can change the state; anything else fails open.
        if (!res.ok || ignore) return;
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        setState({
          loading: false,
          enabled: data.enabled !== false,
          notice: data.notice || null,
          note: data.note || '',
        });
      } catch {
        /* network failure: keep the portal as it is */
      }
    };

    read();
    return () => {
      ignore = true;
    };
  }, [skip]);

  return state;
}

export default useDividendAccessState;
