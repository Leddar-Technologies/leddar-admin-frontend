import { Fragment, useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import CommissionCard from '@/components/ui/CommissionCard';
import PaymentRow from '@/components/admin/PaymentRow';
import { formatCurrency } from '@/lib/utils';
import { calculateCommissionBreakdown, getCommissionSettings } from '@/services/commissionService';
import { getPayments, markInvoicePaid, releaseStage } from '@/services/paymentsService';
import { getOrders } from '@/services/ordersService';
import { getJobs } from '@/services/jobsService';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [orderMap, setOrderMap] = useState({});
  const [jobMap, setJobMap] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [confirmModal, setConfirmModal] = useState({ open: false, payment: null, stage: 1, amount: 0 });
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function loadData() {
      const [paymentsData, settingsData, ordersData, jobsData] = await Promise.all([
        getPayments(),
        getCommissionSettings(),
        getOrders(),
        getJobs(),
      ]);

      setPayments(paymentsData);
      setSettings(settingsData);
      setOrderMap(Object.fromEntries(ordersData.map((order) => [order.id, order])));
      setJobMap(Object.fromEntries(jobsData.map((job) => [job.orderId, job])));
    }

    loadData();
  }, []);

  const paymentsWithBreakdown = useMemo(() => {
    if (!settings) return [];
    return payments.map((payment) => ({
      ...payment,
      breakdown: calculateCommissionBreakdown(payment.fullAmount, payment.type, settings),
    }));
  }, [payments, settings]);

  const headlineTotals = {
    totalEscrow: 840000,
    totalCommission: 126000,
    totalReleased: 504000,
  };

  const refresh = async () => {
    setPayments(await getPayments());
  };

  const handleMarkPaid = async (paymentId) => {
    await markInvoicePaid(paymentId);
    await refresh();
  };

  const openStageConfirm = (payment, amount, stage) => {
    setConfirmModal({ open: true, payment, stage, amount });
  };

  const confirmRelease = async () => {
    await releaseStage(confirmModal.payment.id, confirmModal.stage);
    setConfirmModal({ open: false, payment: null, stage: 1, amount: 0 });
    await refresh();
    setToast('WhatsApp notification sent to artisan.');
    setTimeout(() => setToast(''), 2000);
  };

  const toggleExpand = (paymentId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  return (
    <PageWrapper title="Escrow & Payment Management">
      {toast ? <div className="mb-4 rounded-xl bg-success/15 px-4 py-2 text-sm font-semibold text-success">{toast}</div> : null}

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl bg-gold p-5 text-espresso shadow-card">
          <p className="text-sm">Total Held in Escrow</p>
          <h3 className="mt-2 text-2xl font-extrabold">{formatCurrency(headlineTotals.totalEscrow)}</h3>
        </article>
        <article className="rounded-xl bg-leather p-5 text-neutral-50 shadow-card">
          <p className="text-sm">Total Commission Earned</p>
          <h3 className="mt-2 text-2xl font-extrabold">{formatCurrency(headlineTotals.totalCommission)}</h3>
        </article>
        <article className="rounded-xl bg-success p-5 text-neutral-50 shadow-card">
          <p className="text-sm">Total Released to Artisans</p>
          <h3 className="mt-2 text-2xl font-extrabold">{formatCurrency(headlineTotals.totalReleased)}</h3>
        </article>
      </section>

      <Table
        headers={[
          'Order ID',
          'Brand',
          'Artisan',
          'Type',
          'Full Amount',
          'Admin Commission',
          'Stage 1 Amount',
          'Stage 2 Amount',
          'Escrow Status',
          'Actions',
        ]}
      >
        {paymentsWithBreakdown.map((payment) => {
          const order = orderMap[payment.orderId];
          const job = jobMap[payment.orderId];
          const canReleaseStage1 = order?.status === 'In Production';
          const canReleaseStage2 = job?.status === 'Completed' || order?.status === 'Delivered';

          return (
            <Fragment key={payment.id}>
              <PaymentRow
                payment={payment}
                breakdown={payment.breakdown}
                canReleaseStage1={canReleaseStage1}
                canReleaseStage2={canReleaseStage2}
                onReleaseStage1={(item, amount) => openStageConfirm(item, amount, 1)}
                onReleaseStage2={(item, amount) => openStageConfirm(item, amount, 2)}
                onMarkPaid={handleMarkPaid}
                onToggleExpand={toggleExpand}
              />
              {expandedRows[payment.id] ? (
                <tr>
                  <td className="px-4 py-4" colSpan={10}>
                    <CommissionCard breakdown={payment.breakdown} title={`Split for ${payment.orderId}`} />
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
      </Table>

      <Modal
        title={`Release Stage ${confirmModal.stage}`}
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, payment: null, stage: 1, amount: 0 })}
      >
        <p className="text-sm text-muted-300">
          Release {formatCurrency(confirmModal.amount)} to {confirmModal.payment?.artisan}? This action cannot be undone.
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="rounded-xl bg-leather px-4 py-2 text-sm font-semibold text-neutral-50"
            onClick={confirmRelease}
          >
            Confirm Release
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
