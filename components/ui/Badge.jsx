import { cn } from '@/lib/utils';

const statusStyles = {
  Verified: 'bg-success/15 text-success',
  Active: 'bg-success/15 text-success',
  Paid: 'bg-success/15 text-success',
  Completed: 'bg-success/15 text-success',
  Sent: 'bg-success/15 text-success',
  Pending: 'bg-gold/20 text-leather',
  'Pending Approval': 'bg-gold/20 text-leather',
  Held: 'bg-gold/20 text-leather',
  Suspended: 'bg-danger/15 text-danger',
  Failed: 'bg-danger/15 text-danger',
  Rejected: 'bg-danger/15 text-danger',
  Default: 'bg-neutral-200 text-muted-300',
};

export default function Badge({ children, className }) {
  const value = String(children || 'Default');
  const style = statusStyles[value] || statusStyles.Default;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', style, className)}>
      {children}
    </span>
  );
}
