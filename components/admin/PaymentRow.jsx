import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

export default function PaymentRow({
  payment,
  breakdown,
  canReleaseStage1,
  canReleaseStage2,
  onReleaseStage1,
  onReleaseStage2,
  onMarkPaid,
  onToggleExpand,
}) {
  return (
    <>
      <tr>
        <td className="px-4 py-3 font-semibold text-ink">{payment.orderId}</td>
        <td className="px-4 py-3 text-muted-300">{payment.brand}</td>
        <td className="px-4 py-3 text-muted-300">{payment.artisan}</td>
        <td className="px-4 py-3"><Badge>{payment.type}</Badge></td>
        <td className="px-4 py-3 text-muted-300">{formatCurrency(payment.fullAmount)}</td>
        <td className="px-4 py-3 text-leather font-semibold">{formatCurrency(breakdown.adminCommission)}</td>
        <td className="px-4 py-3 text-success font-semibold">{formatCurrency(breakdown.artisanStage1)}</td>
        <td className="px-4 py-3 text-success font-semibold">{formatCurrency(breakdown.artisanStage2)}</td>
        <td className="px-4 py-3"><Badge>{payment.escrowStatus}</Badge></td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={payment.stage1Released || !canReleaseStage1}
              onClick={() => onReleaseStage1(payment, breakdown.artisanStage1)}
            >
              Release Stage 1
            </Button>
            <Button
              size="sm"
              variant="accent"
              disabled={payment.stage2Released || !canReleaseStage2}
              onClick={() => onReleaseStage2(payment, breakdown.artisanStage2)}
            >
              Release Stage 2
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={payment.invoiceStatus === 'Paid'}
              onClick={() => onMarkPaid(payment.id)}
            >
              Mark Invoice Paid
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onToggleExpand(payment.id)}>
              Breakdown
            </Button>
          </div>
        </td>
      </tr>
    </>
  );
}
