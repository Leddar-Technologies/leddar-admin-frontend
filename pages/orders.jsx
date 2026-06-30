import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import AdminRoute from '@/components/auth/AdminRoute';
import { formatCurrency } from '@/lib/utils';
import {
  getOrders, setProductionPricing,
} from '@/services/ordersService';

const STATUS_PIPELINE_LABEL = {
  SUBMITTED:          "Submitted",
  FLAT_FEE_PAID:      "Fee Paid",
  SAMPLE_IN_PROGRESS: "Sample In Progress",
  SAMPLE_COMPLETED:   "Sample Completed",
  SAMPLE_APPROVED:    "Sample Approved",
  BALANCE_PAID:       "Balance Paid",
  IN_PRODUCTION:      "In Production",
  PENDING_DELIVERY:   "Pending Delivery",
  SHIPPED:            "Shipped",
  DELIVERED:          "Delivered",
};

const tabs = ['All Orders', 'Sample Orders', 'Production Orders'];

export default function OrdersPage() {
  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('All Orders');
  const [toast, setToast]             = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Pricing modal
  const [pricingModal, setPricingModal] = useState({ open: false, order: null });
  const [price, setPrice]             = useState('');
  const [materials, setMaterials]     = useState('');
  const [labour, setLabour]           = useState('');
  const [pricingError, setPricingError] = useState('');

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  const loadOrders = async () => {
    setLoading(true);
    try { setRows(await getOrders()); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  // Sample phase ends at SAMPLE_APPROVED — anything beyond is production phase
  const SAMPLE_STATUSES = new Set(['SUBMITTED', 'FLAT_FEE_PAID', 'SAMPLE_IN_PROGRESS', 'SAMPLE_COMPLETED', 'SAMPLE_APPROVED']);
  const isProductionPhase = (r) => r.type === 'PRODUCTION' || !SAMPLE_STATUSES.has(r.status);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All Orders')        return rows;
    if (activeTab === 'Sample Orders')     return rows.filter((r) => !isProductionPhase(r));
    if (activeTab === 'Production Orders') return rows.filter((r) => isProductionPhase(r));
    return rows;
  }, [rows, activeTab]);

  // Production pricing
  const openPricingModal = (order) => {
    setPricingModal({ open: true, order });
    setPrice('');
    setMaterials('');
    setLabour('');
    setPricingError('');
  };

  const submitPricing = async (e) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) { setPricingError('Enter a valid production price.'); return; }
    setActionLoading(true);
    try {
      await setProductionPricing({
        orderId:   pricingModal.order.id,
        price:     Number(price),
        materials: Number(materials) || 0,
        labour:    Number(labour) || 0,
      });
      setPricingModal({ open: false, order: null });
      await loadOrders();
      showToast('Production pricing set. Brand will be notified to pay the balance.');
    } catch (err) {
      setPricingError(err.response?.data?.message || 'Failed to set pricing.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminRoute>
      <PageWrapper
        title="Order Management"
        subtitle="Track and manage all brand orders through the pipeline"
      >
        {/* Toast */}
        {toast && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold border ${
            toast.isError
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>{toast.msg}</div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab ? 'bg-leather text-white' : 'bg-[#F4EFEA] text-[#6A5B54] hover:bg-atmosphere'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                    {[
                      'Order ID', 'Brand', 'Type', 'Product', 'Status', 'Amount',
                      ...(activeTab !== 'All Orders' ? ['VAT'] : []),
                      'Date',
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab !== 'All Orders' ? 8 : 7} className="py-16 text-center text-[#A39289]">No orders found.</td>
                    </tr>
                  ) : filteredRows.map((order) => (
                    <tr key={order.id} className="hover:bg-atmosphere/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-bold text-leather">{order.ref || `#${order.id.slice(0, 8).toUpperCase()}`}</p>
                        {order.quoteRef && (
                          <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{order.quoteRef}]</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{order.brand}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isProductionPhase(order) ? 'info' : 'warning'}>
                          {isProductionPhase(order) ? 'Production' : 'Sample'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#5A4A44]">{order.productType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          order.status === 'DELIVERED'    ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'IN_PRODUCTION' ? 'bg-blue-50 text-blue-700'
                          : order.status === 'SAMPLE_APPROVED' ? 'bg-[#FFF8EA] text-[#8B6A39]'
                          : 'bg-[#F4EFEA] text-[#6A5B54]'
                        }`}>
                          {STATUS_PIPELINE_LABEL[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5A4A44]">
                        {isProductionPhase(order)
                          ? formatCurrency(order.price || order.totalAmount || 0)
                          : formatCurrency(order.flatFeePaid || order.totalAmount || 0)}
                        {order.status === 'SAMPLE_APPROVED' && !order.price && (
                          <button
                            onClick={() => openPricingModal(order)}
                            className="mt-1 block rounded-lg bg-gold px-3 py-1 text-xs font-bold text-espresso hover:bg-gold/80 transition-colors"
                          >
                            Set Pricing
                          </button>
                        )}
                      </td>
                      {activeTab !== 'All Orders' && (
                        <td className="px-4 py-3 text-[#5A4A44]">
                          {activeTab === 'Sample Orders'
                            ? formatCurrency((order.totalAmount || 0) - (order.flatFeePaid || 0))
                            : order.price
                              ? formatCurrency(Math.round((order.price - (order.flatFeePaid || 0)) * 0.075))
                              : '—'
                          }
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-[#A39289]">
                        {new Date(order.createdAt).toLocaleDateString('en-NG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* UPDATE STATUS MODAL                                              */}
        {/* ---------------------------------------------------------------- */}
        {/* SET PRODUCTION PRICING MODAL                                     */}
        {/* ---------------------------------------------------------------- */}
        <Modal
          title="Set Production Pricing"
          open={pricingModal.open}
          onClose={() => setPricingModal({ open: false, order: null })}
        >
          {pricingModal.order && (
            <div className="space-y-4">
              <div className="rounded-xl bg-atmosphere border border-[#E8DED5] p-3 text-sm">
                <p className="font-semibold text-ink">{pricingModal.order.brand}</p>
                <p className="text-[#A39289] text-xs mt-0.5">
                  {pricingModal.order.productType} · Qty: {pricingModal.order.quantity}
                </p>
                <p className="text-xs text-[#A39289] mt-0.5">
                  Sample flat fee paid: {formatCurrency(pricingModal.order.flatFeePaid || 30000)} (will be deducted)
                </p>
              </div>

              <p className="text-sm text-[#5A4A44]">
                Enter the full production price. The system will automatically calculate the balance
                due (total minus the ₦30,000 sample fee already paid) and commission splits.
              </p>

              <form className="space-y-4" onSubmit={submitPricing}>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">Full Production Price (₦) *</label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                    required
                  />
                  {price && Number(price) > 30000 && (
                    <p className="mt-1 text-xs text-[#8B6A39]">
                      Balance due: {formatCurrency(Number(price) - (pricingModal.order.flatFeePaid || 30000))} (+ VAT)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">Materials Cost (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={materials}
                      onChange={(e) => setMaterials(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">Labour Cost (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={labour}
                      onChange={(e) => setLabour(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                    />
                  </div>
                </div>

                {pricingError && (
                  <p className="text-sm text-red-600">{pricingError}</p>
                )}

                <div className="flex gap-3">
                  <Button type="submit" variant="accent" className="flex-1" disabled={actionLoading}>
                    {actionLoading
                      ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" /> Setting...</span>
                      : 'Set Pricing & Notify Brand'
                    }
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPricingModal({ open: false, order: null })}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </PageWrapper>
    </AdminRoute>
  );
}
