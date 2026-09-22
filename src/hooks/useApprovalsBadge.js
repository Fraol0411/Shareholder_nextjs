'use client';

import { useCallback, useEffect, useState } from 'react';
import { getToken, isAdminRole, isStaffRole } from '../libs/auth';

/**
 * Polls pending approval count for staff/admin notification badges.
 */
export function useApprovalsBadge({ enabled = true, intervalMs = 45000 } = {}) {
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approvals/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        setPending(0);
        return;
      }
      const data = await res.json();
      setPending(Number(data.pending) || 0);
    } catch {
      /* keep last known count */
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPending(0);
      return undefined;
    }

    refresh();
    const id = setInterval(refresh, intervalMs);

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs, refresh]);

  return { pending, loading, refresh };
}

export function shouldShowApprovalsBadge(role) {
  return isAdminRole(role) || isStaffRole(role);
}
