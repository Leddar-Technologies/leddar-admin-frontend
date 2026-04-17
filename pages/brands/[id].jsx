import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import PageWrapper from '@/components/layout/PageWrapper';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getBrandById } from '@/services/brandsService';
import { getOrders } from '@/services/ordersService';
import { getPayments } from '@/services/paymentsService';
import { calculateCommissionBreakdown, getCommissionSettings } from '@/services/commissionService';

export default function BrandProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [brand, setBrand] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('Orders');

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const [brandData, orderData, paymentData, settingsData] = await Promise.all([
        getBrandById(id),
        getOrders(),
        getPayments(),
        getCommissionSettings(),
      ]);

      setBrand(brandData);
      setOrders(orderData.filter((order) => order.brand === brandData?.businessName));
      setPayments(paymentData.filter((payment) => payment.brand === brandData?.businessName));
      setSettings(settingsData);
    }

    loadData();
  }, [id]);

  const paymentRows = useMemo(() => {
    if (!settings) return [];
    return payments.map((payment) => {
      const breakdown = calculateCommissionBreakdown(payment.fullAmount, payment.type, settings);
      return { ...payment, breakdown };
    });
  }, [payments, settings]);

  if (!brand) return null;

  return (
    <PageWrapper title="Brand Profile">
      <section className="rounded-xl bg-neutral-50 p-6 shadow-card">
        <h3 className="font-display text-xl font-bold text-ink">{brand.businessName}</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted-300 sm:grid-cols-2">
          <p>Email: {brand.email}</p>
          <p>WhatsApp: {brand.whatsapp}</p>
          <p>Product Type: {brand.productType}</p>
          <p>Registered: {formatDate(brand.registrationDate)}</p>
          <p>Status: <Badge>{brand.status}</Badge></p>
          <p>KYC: <Badge>{brand.kycStatus}</Badge></p>
        </div>
      </section>

      <div className="mt-6 flex gap-2">
        {['Orders', 'Payment History'].map((label) => (
          <button
            key={label}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === label ? 'bg-leather text-neutral-50' : 'bg-neutral-100 text-muted-300'}`}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'Orders' ? (
          <Table headers={['Order ID', 'Type', 'Product', 'Status', 'Amount']}>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-semibold text-ink">{order.id}</td>
                <td className="px-4 py-3 text-muted-300">{order.orderType}</td>
                <td className="px-4 py-3 text-muted-300">{order.productType}</td>
                <td className="px-4 py-3"><Badge>{order.status}</Badge></td>
                <td className="px-4 py-3 text-muted-300">{formatCurrency(order.fullAmount)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table headers={['Order ID', 'Full Amount', 'Commission', 'Invoice Status']}>
            {paymentRows.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-semibold text-ink">{payment.orderId}</td>
                <td className="px-4 py-3 text-muted-300">{formatCurrency(payment.fullAmount)}</td>
                <td className="px-4 py-3 text-leather font-semibold">{formatCurrency(payment.breakdown.adminCommission)}</td>
                <td className="px-4 py-3"><Badge>{payment.invoiceStatus}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </PageWrapper>
  );
}
