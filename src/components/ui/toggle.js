'use client';

import * as React from 'react';
import { cn } from '../../libs/utils';

/**
 * iOS / macOS style switch.
 *
 * A single control for yes/no settings: the track fills with the accent colour
 * and the knob slides across with the standard iOS easing curve. Use it anywhere
 * a switch reads better than a button, and keep the meaning of `checked` the
 * same across the product (checked = allowed), so people never have to wonder
 * which way is "on".
 *
 * `onCheckedChange(next)` is the only callback — the component is fully
 * controlled, so a page can await the server before it updates the visual state
 * (or roll it back when the request fails).
 */

// iOS switches are 51 x 31 pt with a 27 pt knob that travels 20 pt.
// The sizes below keep that proportion: knob = track height minus 4, inset 2.
const TOGGLE_SIZES = {
  sm: { track: 'h-5 w-8', knob: 'h-4 w-4', off: 'translate-x-0.5', on: 'translate-x-[14px]' },
  md: { track: 'h-[26px] w-11', knob: 'h-[22px] w-[22px]', off: 'translate-x-0.5', on: 'translate-x-[20px]' },
  lg: { track: 'h-[31px] w-[51px]', knob: 'h-[27px] w-[27px]', off: 'translate-x-0.5', on: 'translate-x-[22px]' },
};

export function Toggle({
  checked = false,
  onCheckedChange,
  disabled = false,
  pending = false,
  size = 'md',
  className,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  const dims = TOGGLE_SIZES[size] || TOGGLE_SIZES.md;
  const interactive = !disabled && !pending;

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      disabled={!interactive}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border-transparent outline-none transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'focus-visible:ring-2 focus-visible:ring-brand-secondary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
        checked ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-700',
        interactive ? 'cursor-pointer' : 'cursor-not-allowed',
        pending && 'opacity-70',
        dims.track,
        className
      )}
      {...props}
    >
      {/* Knob — white with the soft iOS drop shadow; holds a spinner while saving */}
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.6)]',
          dims.knob,
          checked ? dims.on : dims.off
        )}
      >
        {pending && (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-slate-300 border-t-brand-primary" />
        )}
      </span>
    </button>
  );
}

/**
 * Short state word that sits next to a Toggle (iOS shows "On" in grey beside the
 * switch in some panes; here it also carries the count so the line is honest).
 */
export function ToggleState({ tone = 'neutral', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        tone === 'positive' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
        tone === 'negative' && 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
        tone === 'neutral' && 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
        className
      )}
    >
      {children}
    </span>
  );
}
