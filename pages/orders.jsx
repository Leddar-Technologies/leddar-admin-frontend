import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import OrderRow from '@/components/admin/OrderRow';
import { getOrders, getNextStatuses, updateOrderStatus } from '@/services/ordersService';

const tabs = ['All Orders', 'Sample Orders', 'Production Orders'];

export default function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [statusModal, setStatusModal] = useState({ open: false, order: null });
  const [nextStatuses, setNextStatuses] = useState([]);
  const [nextStatus, setNextStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    getOrders().then(setRows);
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All Orders') return rows;
    if (activeTab === 'Sample Orders') return rows.filter((row) => row.orderType === 'Sample');
    return rows.filter((row) => row.orderType === 'Production');
  }, [rows, activeTab]);

  const openModal = async (order) => {
    const nextOptions = await getNextStatuses(order.id);
    setNextStatuses(nextOptions);
    setNextStatus(nextOptions[0] || '');
    setNotes('');
    setStatusModal({ open: true, order });
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    await updateOrderStatus({
      orderId: statusModal.order.id,
      nextStatus,
      note: notes,
    });

    setStatusModal({ open: false, order: null });
    setRows(await getOrders());
    setToast('Email and WhatsApp notification sent to brand.');
    setTimeout(() => setToast(''), 2200);
  };

  return (
    <PageWrapper title="Order Management">
      {toast ? <div className="mb-4 rounded-xl bg-success/15 px-4 py-2 text-sm font-semibold text-success">{toast}</div> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-leather text-neutral-50' : 'bg-neutral-100 text-muted-300'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <Table headers={['Order ID', 'Brand', 'Order Type', 'Product Type', 'Status', 'Date', 'Actions']}>
        {filteredRows.map((order) => (
          <OrderRow key={order.id} order={order} onUpdateStatus={openModal} />
        ))}
      </Table>

      <Modal title="Update Status" open={statusModal.open} onClose={() => setStatusModal({ open: false, order: null })}>
        <form className="space-y-3" onSubmit={submitStatus}>
          <label className="block text-sm text-muted-300">
            Next Valid Status
            <select
              value={nextStatus}
              onChange={(event) => setNextStatus(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              required
            >
              {nextStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-muted-300">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
            />
          </label>

          <Button type="submit" variant="primary">Confirm Update</Button>
        </form>
      </Modal>
    </PageWrapper>
  );
}
