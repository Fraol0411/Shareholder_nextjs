'use client';

import { useEffect, useState } from 'react';
import { HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlineCheckCircle } from 'react-icons/hi2';
import { Dialog, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';

/**
 * Replacement for window.confirm() / window.alert() across the app.
 *
 * tone='danger' + requireText turns the confirm button into a
 * "type the exact value first" guard for irreversible actions.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  bullets = [],
  details = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  isBusy = false,
  requireText = null,
  onConfirm,
}) {
  const [typed, setTyped] = useState('');

  // Every new confirmation starts blank
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const gated = Boolean(requireText) && typed.trim() !== String(requireText);
  const destructive = tone === 'danger';

  const icon = destructive ? (
    <HiOutlineExclamationTriangle className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={1.75} />
  ) : tone === 'success' ? (
    <HiOutlineCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
  ) : (
    <HiOutlineInformationCircle className="h-5 w-5" strokeWidth={1.75} />
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isBusy) return;
        onOpenChange(next);
      }}
      title={title}
      description={description}
      icon={icon}
      footer={
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => onConfirm?.(typed.trim())}
            disabled={isBusy || gated}
          >
            {isBusy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      }
    >
      <div className="space-y-4">
        {bullets.length > 0 && (
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {bullets.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary" aria-hidden="true" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {details}

        {requireText && (
          <div className="space-y-1.5">
            <label className="ml-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Type <span className="font-mono text-red-600 dark:text-red-400">{requireText}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              placeholder={String(requireText)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm outline-none transition-all focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}
