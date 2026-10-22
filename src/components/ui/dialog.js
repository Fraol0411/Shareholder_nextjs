'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { HiOutlineXMark } from 'react-icons/hi2';
import { cn } from '../../libs/utils';

/**
 * Project dialog shell (Radix Dialog: portal, focus trap, Escape, scroll lock).
 * Keep `title` always mounted inside the Content for accessibility.
 */
export function Dialog({ open, onOpenChange, title, description, icon, children, footer, className, contentClassName, closeOnOverlayClick = true }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-overlay fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm" />
        <RadixDialog.Content
          onPointerDownOutside={
            closeOnOverlayClick ? undefined : (event) => event.preventDefault()
          }
          className={cn(
            'dialog-content fixed left-1/2 top-1/2 z-[100] flex max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900',
            contentClassName
          )}
        >
          {(title || icon) && (
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
              <div className="flex items-start gap-3">
                {icon && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-secondary/15 text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary">
                    {icon}
                  </span>
                )}
                <div className="min-w-0">
                  <RadixDialog.Title className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                    {title}
                  </RadixDialog.Title>
                  {description && (
                    <RadixDialog.Description className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {description}
                    </RadixDialog.Description>
                  )}
                </div>
              </div>
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <HiOutlineXMark className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </RadixDialog.Close>
            </div>
          )}

          <div className={cn('flex-1 overflow-y-auto px-5 py-5 sm:px-6', className)}>{children}</div>

          {footer && (
            <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function DialogFooter({ className, children }) {
  return (
    <div className={cn('flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}>{children}</div>
  );
}
