import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function OrderRow({ order, onUpdateStatus }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{order.id}</td>
      <td className="px-4 py-3 text-muted-300">{order.brand}</td>
      <td className="px-4 py-3"><Badge>{order.orderType}</Badge></td>
      <td className="px-4 py-3 text-muted-300">{order.productType}</td>
      <td className="px-4 py-3"><Badge>{order.status}</Badge></td>
      <td className="px-4 py-3 text-muted-300">{formatDate(order.date)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(order)}>
            Update Status
          </Button>
          <Link href={`/orders/${order.id}`} className="text-xs font-semibold text-leather underline">
            View Detail
          </Link>
        </div>
      </td>
    </tr>
  );
}
