import Badge from '@/components/ui/Badge';

const CHANNEL_COLORS = {
  WHATSAPP: 'bg-emerald-50 text-emerald-700',
  EMAIL: 'bg-blue-50 text-blue-700',
};

const TYPE_LABELS = {
  ORDER_UPDATE:           'Order Update',
  PAYMENT_UPDATE:         'Payment Update',
  JOB_ASSIGNED:           'Job Assigned',
  SAMPLE_READY:           'Sample Ready',
  QUOTE_READY:            'Quote Ready',
  BALANCE_INVOICE:        'Balance Invoice',
  SAMPLE_REVISION:        'Sample Revision',
  PAYMENT_RELEASED:       'Payment Released',
  SAMPLE_FEE_PAID:        'Sample Fee Paid',
  PRODUCTION_JOB_ASSIGNED:'Production Job',
};

export default function NotificationItem({ notification }) {
  const typeLabel = TYPE_LABELS[notification.type] || notification.type?.replace(/_/g, ' ');
  const channelColor = CHANNEL_COLORS[notification.channel] || 'bg-neutral-100 text-neutral-600';
  const timestamp = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString('en-NG')
    : '—';

  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{notification.recipient || '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${channelColor}`}>
          {notification.channel}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-300">{typeLabel}</td>
      <td className="px-4 py-3 text-muted-300 max-w-xs truncate">{notification.message}</td>
      <td className="px-4 py-3 text-muted-300">{timestamp}</td>
      <td className="px-4 py-3">
        <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700">
          Sent
        </span>
      </td>
    </tr>
  );
}
