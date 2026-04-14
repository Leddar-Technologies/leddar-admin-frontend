import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-leather text-neutral-50 hover:bg-leather/90',
        accent: 'bg-gold text-espresso hover:bg-gold/90',
        outline: 'border border-neutral-500 bg-neutral-50 text-ink hover:bg-neutral-100',
        ghost: 'bg-transparent text-ink hover:bg-neutral-200',
        danger: 'bg-danger text-neutral-50 hover:bg-danger/90',
      },
      size: {
        md: 'h-10',
        sm: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export default function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
