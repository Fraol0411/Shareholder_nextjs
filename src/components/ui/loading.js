'use client';

import { cn } from '../../libs/utils';
import { useTranslation } from '../LanguageProvider';

/**
 * Loading surfaces shared by every page that waits on the server.
 *
 * The rule these enforce: a page that is still fetching must never render an empty
 * state. "No records found" shown two hundred milliseconds before the records
 * arrive is a lie a shareholder acts on — they call the branch. Equally, a spinner
 * that only lives inside a Refresh button is easy to miss, so sections get their own
 * placeholder while the first load is in flight.
 */

/** The brand ring. Sized by className so a button can use h-4 or a panel h-9. */
export function Spinner({ className }) {
  const { t } = useTranslation();
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={t('common.loading')}
      className={cn(
        'inline-block h-9 w-9 shrink-0 animate-spin rounded-full border-[3px] border-brand-secondary/25 border-t-brand-secondary',
        className,
      )}
    />
  );
}

/**
 * Block-level placeholder for a section whose content has not arrived yet.
 * Use while `isLoading && !data`; keep skeletons for reloads of an existing list.
 */
export function LoadingState({ label, description, className, boxClassName }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-brand-secondary/20 bg-white/80 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/60',
        boxClassName,
        className,
      )}
    >
      <Spinner />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label || t('common.loading')}</p>
      {description && (
        <p className="max-w-md text-xs text-slate-400 dark:text-slate-500">{description}</p>
      )}
    </div>
  );
}

/**
 * Pulsing stand-ins for rows or cards that are about to appear, so the layout does
 * not jump when the data lands. `rows` is roughly how many items are expected.
 */
export function SkeletonRows({ rows = 3, className, itemClassName }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800',
            itemClassName,
          )}
        >
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-3 w-2/3 rounded bg-slate-100/80 dark:bg-slate-700/80" />
            </div>
            <div className="h-6 w-16 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Quiet "still working" chip for a refetch that leaves the previous rows on screen.
 * The data stays visible, so a full-page spinner would be wrong — but silence looks
 * like the click did nothing.
 */
export function BusyChip({ show = true, label, className }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-brand-secondary-soft px-2.5 py-1 text-[11px] font-semibold text-brand-secondary-hover dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
    >
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-secondary/30 border-t-brand-secondary" />
      {label || t('common.updating')}
    </span>
  );
}
