import { formatCurrency } from '@/lib/utils';

export default function CommissionCard({ title = 'Commission Breakdown', breakdown }) {
  if (!breakdown) return null;

  return (
    <section className="rounded-xl bg-neutral-100 p-4">
      <h4 className="font-semibold text-ink">{title}</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-xs text-muted-200">Admin ({breakdown.adminPercent}%)</p>
          <p className="text-sm font-bold text-leather">{formatCurrency(breakdown.adminCommission)}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-xs text-muted-200">Artisan Stage 1 ({breakdown.stage1Percent}%)</p>
          <p className="text-sm font-bold text-success">{formatCurrency(breakdown.artisanStage1)}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-xs text-muted-200">Artisan Stage 2 ({breakdown.stage2Percent}%)</p>
          <p className="text-sm font-bold text-success">{formatCurrency(breakdown.artisanStage2)}</p>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-xs text-muted-200">Order Amount</p>
          <p className="text-sm font-bold text-ink">{formatCurrency(breakdown.fullAmount)}</p>
        </div>
      </div>
    </section>
  );
}
