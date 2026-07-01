import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

const STATUS_VARIANT = {
  SUBMITTED:    'warning',
  UNDER_REVIEW: 'info',
  APPROVED:     'success',
  REJECTED:     'error',
};

const STATUS_LABEL = {
  SUBMITTED:    'Pending Response',
  UNDER_REVIEW: 'Under Review',
  APPROVED:     'Approved',
  REJECTED:     'Rejected',
};

export default function QuoteRow({ quote, onRespond, onApprove, onReject, onView }) {
  const canRespond  = quote.status === 'SUBMITTED';
  const hasResponse = quote.price != null;

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-[#FAF7F4]"
      onClick={() => onView(quote)}
    >
      <td className="px-4 py-3 font-mono text-xs font-bold text-leather whitespace-nowrap">
        {quote.ref || `#${quote.id?.slice(0, 8).toUpperCase()}`}
      </td>
      <td className="px-4 py-3 font-semibold text-ink">{quote.brandName}</td>
      <td className="px-4 py-3 text-muted-300">{quote.productType}</td>
      <td className="px-4 py-3 text-muted-300 text-xs">{formatDate(quote.createdAt)}</td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[quote.status] || 'default'}>
          {STATUS_LABEL[quote.status] || quote.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-muted-300">
        {hasResponse ? `₦${Number(quote.price).toLocaleString('en-NG')}` : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {canRespond && (
            <Button size="sm" variant="primary" onClick={() => onRespond(quote)}>
              Respond
            </Button>
          )}
          {quote.status === 'UNDER_REVIEW' && (
            <span className="text-xs font-medium text-amber-600">
              Awaiting payment
            </span>
          )}
          {quote.status === 'APPROVED' && (
            <span className="text-xs font-medium text-emerald-600">
              Paid ✓
            </span>
          )}
          {quote.status === 'REJECTED' && (
            <span className="text-xs font-medium text-red-500">
              Rejected
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
