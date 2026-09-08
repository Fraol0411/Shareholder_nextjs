'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../../libs/utils';

export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-slate-200 dark:bg-slate-700',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}
