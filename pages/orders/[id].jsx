import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import PageWrapper from '@/components/layout/PageWrapper';
import Badge from '@/components/ui/Badge';
import CommissionCard from '@/components/ui/CommissionCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getOrderById, getOrderTimeline } from '@/services/ordersService';
import { calculateCommissionBreakdown, getCommissionSettings } from '@/services/commissionService';

const samplePipeline = [
  'Flat Fee Paid',
  'Sample in Production',
  'Video Sent',
  'Sample Approved',
  'Balance Paid',
  'In Full Production',
  'Shipped',
  'Delivered',
];

const productionPipeline = ['Quote Approved', 'In Production', 'Shipped', 'Delivered'];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const [orderData, timelineData, settingsData] = await Promise.all([
        getOrderById(id),
        getOrderTimeline(id),
        getCommissionSettings(),
      ]);
      setOrder(orderData);
      setTimeline(timelineData);
      setSettings(settingsData);
    }

    loadData();
  }, [id]);

  const steps = useMemo(() => {
    if (!order) return [];
    const pipeline = order.orderType === 'Sample' ? samplePipeline : productionPipeline;
    const currentIndex = pipeline.findIndex((step) => step === order.status);
    return pipeline.map((step, index) => ({
      label: step,
      active: index <= (currentIndex === -1 ? -1 : currentIndex),
      current: index === currentIndex,
    }));
  }, [order]);

  const breakdown = useMemo(() => {
    if (!order || !settings) return null;
    return calculateCommissionBreakdown(order.fullAmount, order.orderType, settings);
  }, [order, settings]);

  if (!order) return null;

  return (
    <PageWrapper title="Order Detail">
      <section className="rounded-xl bg-neutral-50 p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-ink">{order.id}</h3>
          <Badge>{order.status}</Badge>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-muted-300 sm:grid-cols-2">
          <p>Brand: {order.brand}</p>
          <p>Artisan: {order.artisan}</p>
          <p>Type: {order.orderType}</p>
          <p>Product: {order.productType}</p>
          <p>Quantity: {order.quantity}</p>
          <p>Date: {formatDate(order.date)}</p>
          <p>Amount: {formatCurrency(order.fullAmount)}</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-neutral-50 p-6 shadow-card">
        <h4 className="font-display text-lg font-bold text-ink">Pipeline Tracker</h4>
        <div className="mt-4 flex flex-wrap gap-2">
          {steps.map((step) => (
            <span
              key={step.label}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                step.current ? 'bg-gold text-espresso' : step.active ? 'bg-leather text-neutral-50' : 'bg-neutral-200 text-muted-300'
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-neutral-50 p-6 shadow-card">
        <h4 className="font-display text-lg font-bold text-ink">Status Timeline</h4>
        <ul className="mt-4 space-y-3">
          {timeline.map((item, index) => (
            <li key={`${item.status}-${index}`} className="rounded-xl bg-neutral-100 p-3 text-sm">
              <p className="font-semibold text-ink">{item.status}</p>
              <p className="text-muted-300">{item.note}</p>
              <p className="mt-1 text-xs text-muted-200">{new Date(item.at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        <CommissionCard breakdown={breakdown} />
      </div>
    </PageWrapper>
  );
}
