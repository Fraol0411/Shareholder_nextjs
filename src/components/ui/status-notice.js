'use client';

import { FaExclamationTriangle } from 'react-icons/fa';
import { cn } from '../../libs/utils';

/**
 * Message box for a page that cannot show dividend data.
 *
 * Two tones, because the two cases must not look alike:
 *   notice — the bank deliberately closed something (data-viewing switch off,
 *            account disabled/locked). Amber, reads as information.
 *   error  — the request failed. Red, reads as a fault.
 *
 * The server marks its deliberate decisions with a reason code, so a page can pick
 * the tone with `res.status === 403 && Boolean(payload.code)`.
 */

export const NOTICE_TITLE = 'Not available right now';
export const ERROR_TITLE = 'Something went wrong';

const TONES = {
  notice: {
    box: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300',
    tile: 'bg-amber-100 dark:bg-amber-900/60',
    title: 'text-amber-900 dark:text-amber-200',
    body: 'text-amber-700 dark:text-amber-300',
  },
  error: {
    box: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300',
    tile: 'bg-red-100 dark:bg-red-900/60',
    title: 'text-red-800 dark:text-red-200',
    body: 'text-red-600 dark:text-red-300',
  },
};

export function StatusNotice({ tone = 'notice', title, message, className, children }) {
  const styles = TONES[tone] || TONES.notice;
  const heading = title || (tone === 'error' ? ERROR_TITLE : NOTICE_TITLE);

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border p-4 sm:p-5', styles.box, className)}
    >
      <div className={cn('shrink-0 rounded-lg p-1.5', styles.tile)}>
        <FaExclamationTriangle className="text-sm" />
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold', styles.title)}>{heading}</p>
        {message && <p className={cn('mt-0.5 break-words text-xs', styles.body)}>{message}</p>}
        {children}
      </div>
    </div>
  );
}
