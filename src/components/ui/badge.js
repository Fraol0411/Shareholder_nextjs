import { cva } from 'class-variance-authority';
import { cn } from '../../libs/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-primary text-white',
        secondary: 'border-transparent bg-brand-secondary text-white',
        outline: 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
        destructive: 'border-transparent bg-red-600 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
