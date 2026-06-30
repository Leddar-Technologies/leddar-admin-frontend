import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import PageWrapper from '@/components/layout/PageWrapper';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import AdminRoute from '@/components/auth/AdminRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getOrderById, getOrderTimeline } from '@/services/ordersService';
import { calculateCommissionBreakdown, getCommissionSettings } from '@/services/commissionService';

const SAMPLE_PIPELINE = [
  { key: 'SUBMITTED',          label: 'Submitted' },
  { key: 'FLAT_FEE_PAID',      label: 'Flat Fee Paid' },
  { key: 'SAMPLE_IN_PROGRESS', label: 'Sample In Progress' },
  { key: 'SAMPLE_COMPLETED',   label: 'Sample Completed' },
  { key: 'SAMPLE_APPROVED',    label: 'Sample Approved' },
  { key: 'BALANCE_PAID',       label: 'Balance Paid' },
  { key: 'IN_PRODUCTION',      label: 'In Production' },
  { key: 'SHIPPED',            label: 'Shipped' },
  { key: 'DELIVERED',          label: 'Delivered' },
];

const PRODUCTION_PIPELINE = [
  { key: 'SUBMITTED',     label: 'Submitted' },
  { key: 'IN_PRODUCTION', label: 'In Production' },
  { key: 'SHIPPED',       label: 'Shipped' },
  { key: 'DELIVERED',     label: 'Delivered' },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder]       = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      const [orderData, timelineData, settingsData] = await Promise.all([
        getOrderById(id),
        getOrderTimeline(id),
        getCommissionSettings(),
      ]);
      setOrder(orderData);
      setTimeline(timelineData);
      setSettings(settingsData);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const pipeline = useMemo(() => {
    if (!order) return [];
    const steps = order.type === 'SAMPLE' ? SAMPLE_PIPELINE : PRODUCTION_PIPELINE;
    const currentIdx = steps.findIndex((s) => s.key === order.status);
    return steps.map((step, i) => ({
      ...step,
      done:    i < currentIdx,
      current: i === currentIdx,
    }));
  }, [order]);

  const breakdown = useMemo(() => {
    if (!order || !settings) return null;
    return calculateCommissionBreakdown(order.fullAmount, order.type, settings);
  }, [order, settings]);

  // Get artisan name from job
  const artisanName = order?.jobs?.[0]?.artisan?.fullName || '—';

  if (loading) return (
    <AdminRoute>
      <PageWrapper title="Order Detail">
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" color="leather" /></div>
      </PageWrapper>
    </AdminRoute>
  );

  if (!order) return (
    <AdminRoute>
      <PageWrapper title="Order Detail">
        <p className="text-[#A39289]">Order not found.</p>
      </PageWrapper>
    </AdminRoute>
  );

  return (
    <AdminRoute>
      <PageWrapper title={`Order ${order.ref || `#${order.id.slice(0, 8).toUpperCase()}`}`} subtitle={`${order.brand} · ${order.orderType}`}>

        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
          <div className="bg-atmosphere/40 px-6 py-5 border-b border-[#F4EFEA]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-xs font-bold text-leather">{order.ref || `#${order.id.toUpperCase()}`}</p>
                  {order.quoteRef && (
                    <p className="font-mono text-[10px] text-[#A39289]">[{order.quoteRef}]</p>
                  )}
                </div>
                <h2 className="text-xl font-bold text-ink mt-0.5">{order.brand}</h2>
              </div>
              <div className="flex gap-2">
                <Badge variant={order.type === 'SAMPLE' ? 'warning' : 'info'}>{order.orderType}</Badge>
                <Badge>{order.status?.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#F4EFEA] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Product',  value: order.productType },
              { label: 'Quantity', value: order.quantity },
              { label: 'Amount',   value: formatCurrency(order.fullAmount) },
              { label: 'Artisan',  value: artisanName },
            ].map((item) => (
              <div key={item.label} className="px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A39289]">{item.label}</p>
                <p className="mt-1 font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline tracker */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-[#E8DED5] bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-ink mb-4">Order Pipeline</h3>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {pipeline.map((step, i) => (
              <div key={step.key} className="flex flex-1 flex-col items-center min-w-[80px]">
                <div className="flex w-full items-center">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    step.current ? 'border-gold bg-gold text-espresso'
                    : step.done   ? 'border-success bg-success text-white'
                    : 'border-[#DCCFBE] bg-white text-[#A39289]'
                  }`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className={`h-0.5 flex-1 ${step.done ? 'bg-success' : 'bg-[#E8DED5]'}`} />
                  )}
                </div>
                <p className={`mt-2 text-center text-[10px] font-semibold leading-tight px-1 ${
                  step.current ? 'text-gold' : step.done ? 'text-success' : 'text-[#A39289]'
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-ink mb-4">Status History</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-[#A39289]">No status updates recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {timeline.map((item, i) => (
                  <li key={i} className="rounded-xl border border-[#F4EFEA] bg-atmosphere/30 p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-[#8B6A39]">
                      {item.status?.replace(/_/g, ' ')}
                    </p>
                    {item.note && <p className="mt-1 text-sm text-[#5A4A44]">{item.note}</p>}
                    <p className="mt-1 text-xs text-[#A39289]">
                      {item.at ? new Date(item.at).toLocaleString('en-NG') : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Commission breakdown */}
          {breakdown && (
            <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-ink mb-4">Commission Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Full Amount',        value: formatCurrency(breakdown.fullAmount),     color: 'text-ink' },
                  { label: `Admin Commission (${breakdown.adminPercent}%)`, value: formatCurrency(breakdown.adminCommission), color: 'text-leather' },
                  { label: `Stage 1 — Materials (${breakdown.stage1Percent}%)`, value: formatCurrency(breakdown.stage1Amount), color: 'text-blue-600' },
                  { label: `Stage 2 — Service (${breakdown.stage2Percent}%)`, value: formatCurrency(breakdown.stage2Amount), color: 'text-emerald-600' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl bg-atmosphere/50 px-4 py-3">
                    <p className="text-sm text-[#5A4A44]">{row.label}</p>
                    <p className={`text-sm font-bold ${row.color}`}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Jobs on this order */}
        {order.jobs?.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-3xl border border-[#E8DED5] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-ink mb-4">Jobs</h3>
            <div className="space-y-3">
              {order.jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-xl bg-atmosphere/40 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{job.artisan?.fullName || '—'}</p>
                    <p className="text-xs text-[#A39289]">{job.ref || `#${job.id.slice(0, 8).toUpperCase()}`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={job.type === 'SAMPLE' ? 'warning' : 'info'}>{job.type}</Badge>
                    <Badge>{job.status?.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageWrapper>
    </AdminRoute>
  );
}
