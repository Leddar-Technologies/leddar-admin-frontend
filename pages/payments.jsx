import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import AdminRoute from '@/components/auth/AdminRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCommissionSettings } from '@/services/commissionService';
import { getPayments, markInvoicePaid, releaseStage, getSamplePayments, generateInvoice, getVatSummary, getFIRSRemittances, createFIRSRemittance, getAdminEarnings, createAdminPayout, getArtisanPayoutHistory, resyncPayment } from '@/services/paymentsService';
import { getAllJobsFromOrders, releaseSamplePayment } from '@/services/jobsService';
import { FileText, Landmark, RefreshCw, CheckCircle2, Clock, Plus, ArrowDownToLine, AlertCircle, Loader2, Building2, TrendingUp, ShieldCheck } from 'lucide-react';

// Naira icon — inline SVG component to replace lucide's NairaIcon
const NairaIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="8" x2="19" y2="8" />
    <line x1="5" y1="16" x2="19" y2="16" />
    <path d="M6 4 L18 20" />
    <path d="M18 4 L6 20" />
  </svg>
);

const STAGE_SHORT_MAP = {
  SAMPLE_FLAT_FEE: 'Sample (70%)',
  MATERIAL:        'Stage 1',
  SERVICE:         'Stage 2',
  FULL_PAYMENT:    'Full',
};

export default function PaymentsPage() {
  const [activeTab, setActiveTab]     = useState('production');
  const [payments, setPayments]       = useState([]);
  const [samplePayments, setSamplePayments] = useState([]);
  const [settings, setSettings]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]             = useState({ msg: '', isError: false });
  const CONFIRM_MODAL_INITIAL = {
    open: false, orderId: null, stage: 1, amount: 0, artisan: '',
    orderRef: '', escrowBalance: 0, breakdown: null,
    bankDetail: null, hasBankDetails: false,
    otpStep: false, paymentId: null, otp: '', otpError: '',
  };
  const [confirmModal, setConfirmModal] = useState(CONFIRM_MODAL_INITIAL);
  const [vatData, setVatData] = useState({ summary: {}, records: [] });
  const [pendingSampleJobs, setPendingSampleJobs] = useState([]);
  const SAMPLE_RELEASE_MODAL_INITIAL = {
    open: false, jobId: null, artisan: '', orderRef: '', flatFee: 0, brandPaidTotal: 0, bankDetail: null, hasBankDetails: false,
    otpStep: false, paymentId: null, otp: '', otpError: '',
  };
  const [sampleReleaseModal, setSampleReleaseModal] = useState(SAMPLE_RELEASE_MODAL_INITIAL);
  const [sampleReleaseResult, setSampleReleaseResult] = useState(null);
  const [sampleAlreadyReleased, setSampleAlreadyReleased] = useState(false);
  const [firsRemittances, setFirsRemittances]   = useState([]);
  const [firsModal, setFirsModal]               = useState({ open: false, amount: '', note: '' });
  const [firsLoading, setFirsLoading]           = useState(false);

  // Admin commission / withdrawal
  const [adminEarnings, setAdminEarnings]       = useState({ totalEarned: 0, totalWithdrawn: 0, outstanding: 0, payoutCount: 0, payouts: [] });
  const [withdrawModal, setWithdrawModal]       = useState({ open: false, amount: '', note: '', otpStep: false, payoutId: null, otp: '' });
  const [withdrawLoading, setWithdrawLoading]   = useState(false);
  const [withdrawError, setWithdrawError]       = useState('');
  const [withdrawSuccess, setWithdrawSuccess]   = useState('');

  // Artisan payments stuck awaiting webhook confirmation (PENDING/OTP_PENDING) —
  // re-checked directly against Paystack via the "Verify Payment" action.
  const [pendingPayments, setPendingPayments]   = useState([]);
  const [resyncingId, setResyncingId]           = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast({ msg: '', isError: false }), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, settingsData, sampleData, allJobs, vatResult, remittances, earnings, artisanHistory] = await Promise.all([
        getPayments(),
        getCommissionSettings(),
        getSamplePayments(),
        getAllJobsFromOrders(),
        getVatSummary(),
        getFIRSRemittances(),
        getAdminEarnings(),
        getArtisanPayoutHistory(),
      ]);
      setPayments(paymentsData);
      setSettings(settingsData);
      setSamplePayments(sampleData);
      setVatData(vatResult);
      setFirsRemittances(remittances);
      setAdminEarnings(earnings);
      setPendingPayments(artisanHistory.filter((p) => ['PENDING', 'OTP_PENDING'].includes(p.status)));
      setPendingSampleJobs(
        allJobs.filter((j) => j.type === 'SAMPLE' && ['IN_PROGRESS', 'VIDEO_UPLOADED', 'SAMPLE_APPROVED', 'COMPLETED'].includes(j.status) && !j.samplePaymentReleased)
      );
    } catch (err) {
      showToast('Failed to load payment data.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId, ref) => {
    try {
      const blob = await generateInvoice(orderId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `INV-${ref || orderId.slice(0, 8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Failed to generate invoice.', true);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Build a settings-like object from the order's snapshotted rates (preferred) or live settings (fallback)
  const snapshotSettingsFor = (payment) => ({
    adminRate:         (payment.snapshotAdminRate   ?? settings?.adminRate         ?? 0.15) * 100,
    artisanStage1Rate: (payment.snapshotStage1Rate  ?? settings?.artisanStage1Rate ?? 0.40) * 100,
    artisanStage2Rate: (payment.snapshotStage2Rate  ?? settings?.artisanStage2Rate ?? 0.45) * 100,
    sampleAdminRate:   (payment.snapshotSampleAdminRate ?? settings?.sampleAdminRate ?? 0.30) * 100,
  });

  // Every entry in `payments` (from /admin/payments/escrow) is a production-escrow order —
  // either a true PRODUCTION order or a legacy PATH A order (type SAMPLE carrying production
  // escrow). Commission splits must exclude VAT — VAT is a pass-through to FIRS, not revenue
  // to split with the artisan/admin. `productionBase` is server-computed (see
  // getStableProductionBase in escrow.controller.js) and stays stable even after
  // escrowBalance has been partly decremented by a completed Stage 1/Stage 2 payout.
  const productionBaseFor = (payment) => payment.productionBase || payment.fullAmount || 0;

  // Money is always rounded down, never up or to nearest — matches the actual release
  // amounts computed server-side in escrow.controller.js (releaseStage1/releaseStage2),
  // so a preview here never overstates what a release will actually pay. Local to this
  // page rather than the shared calculateCommissionBreakdown, which other pages (Quotes,
  // Commission Settings) still use for their own previews.
  const splitProduction = (base, rates) => ({
    adminCommission: Math.floor(base * (rates.adminRate / 100)),
    stage1Amount:    Math.floor(base * (rates.artisanStage1Rate / 100)),
    stage2Amount:    Math.floor(base * (rates.artisanStage2Rate / 100)),
  });

  // Real headline totals derived from actual data
  const totals = useMemo(() => {
    const totalEscrow     = payments.reduce((s, p) => s + (p.escrowBalance || 0), 0);
    const totalReleased   = payments.reduce((s, p) => {
      const released = p.payments?.filter((r) => r.status === 'RELEASED').reduce((a, r) => a + r.amount, 0) || 0;
      return s + released;
    }, 0);
    const totalCommission = settings
      ? payments.reduce((s, p) => {
          const b = splitProduction(productionBaseFor(p), snapshotSettingsFor(p));
          return s + (b?.adminCommission || 0);
        }, 0)
      : 0;
    // Sample payment totals
    const sampleTotalReleased    = samplePayments.reduce((s, p) => s + (p.artisanAmount || 0), 0);
    const sampleTotalCommission  = samplePayments.reduce((s, p) => s + (p.adminCommission || 0), 0);
    const sampleTotalVat         = samplePayments.reduce((s, p) => s + (p.vatAmount || 0), 0);
    return { totalEscrow, totalCommission, totalReleased, sampleTotalReleased, sampleTotalCommission, sampleTotalVat };
  }, [payments, settings, samplePayments]);

  const openConfirm = (payment, stage) => {
    const effectiveSettings = snapshotSettingsFor(payment);
    const b = splitProduction(productionBaseFor(payment), effectiveSettings);
    const amount = stage === 1 ? (b?.stage1Amount || 0) : (b?.stage2Amount || 0);
    setConfirmModal({
      open:           true,
      orderId:        payment.orderId,
      orderRef:       payment.orderRef || payment.orderId?.slice(0, 8).toUpperCase(),
      stage,
      amount,
      artisan:        payment.artisan || '—',
      escrowBalance:  payment.escrowBalance || 0,
      breakdown:      b,
      bankDetail:     payment.artisanBankDetail || null,
      hasBankDetails: payment.artisanHasBankDetails || false,
    });
  };

  const confirmRelease = async () => {
    setActionLoading(true);
    try {
      const result = await releaseStage(confirmModal.orderId, confirmModal.stage);
      if (result.requiresOtp) {
        // App-level OTP sent to admin email — switch modal to OTP entry step
        setConfirmModal((p) => ({ ...p, otpStep: true, paymentId: result.data?.id, otp: '', otpError: '' }));
      } else {
        setConfirmModal(CONFIRM_MODAL_INITIAL);
        await loadData();
        showToast(`Stage ${confirmModal.stage} payment submitted for transfer. You'll be notified once Paystack confirms it.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Release failed.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStageOtpConfirm = async () => {
    if (!confirmModal.otp.trim()) {
      setConfirmModal((p) => ({ ...p, otpError: 'Enter the OTP from your email.' }));
      return;
    }
    setActionLoading(true);
    setConfirmModal((p) => ({ ...p, otpError: '' }));
    try {
      const result = await releaseStage(confirmModal.orderId, confirmModal.stage, confirmModal.otp.trim());
      if (result.requiresOtp) {
        // Still awaiting confirmation (e.g. code expired) — let the admin request a fresh one
        setConfirmModal((p) => ({ ...p, otp: '', otpError: result.message || 'Still awaiting confirmation — request a new OTP and try again.' }));
        return;
      }
      const stage = confirmModal.stage;
      setConfirmModal(CONFIRM_MODAL_INITIAL);
      await loadData();
      showToast(result.message || `Stage ${stage} payment confirmed.`);
    } catch (err) {
      setConfirmModal((p) => ({ ...p, otpError: err?.response?.data?.message || 'Incorrect OTP. Please try again.' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSamplePayment = async () => {
    if (!sampleReleaseModal.hasBankDetails) {
      showToast('Cannot release — artisan has not added their bank account yet.', true);
      return;
    }
    setActionLoading(true);
    setSampleReleaseResult(null);
    setSampleAlreadyReleased(false);
    try {
      const result = await releaseSamplePayment(sampleReleaseModal.jobId);
      if (result.requiresOtp) {
        // App-level OTP sent to admin email — switch modal to OTP entry step
        setSampleReleaseModal((p) => ({ ...p, otpStep: true, paymentId: result.data?.payment?.id, otp: '', otpError: '' }));
        return;
      }
      const breakdown = result.data?.breakdown || null;
      setSampleReleaseResult(breakdown);
      // Use actual artisanAmount from the server response; fall back to live sampleAdminRate if somehow absent
      const releasedAmt = breakdown?.artisanAmount
        ?? Math.round((1 - (settings?.sampleAdminRate ?? 0.30)) * sampleReleaseModal.flatFee);
      setSampleReleaseModal(SAMPLE_RELEASE_MODAL_INITIAL);
      await loadData();
      showToast(`✓ ₦${releasedAmt.toLocaleString('en-NG')} submitted for transfer to ${sampleReleaseModal.artisan} via Paystack`);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      const isAlreadyReleased = msg.toLowerCase().includes('already released');
      if (isAlreadyReleased) {
        setSampleAlreadyReleased(true);
        await loadData(); // refresh so the job moves to history and stats update
        showToast('This payment was already released to the artisan.', false);
      } else {
        showToast(msg || 'Payment release failed. Please try again.', true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSampleOtpConfirm = async () => {
    if (!sampleReleaseModal.otp.trim()) {
      setSampleReleaseModal((p) => ({ ...p, otpError: 'Enter the OTP from your email.' }));
      return;
    }
    setActionLoading(true);
    setSampleReleaseModal((p) => ({ ...p, otpError: '' }));
    try {
      const result = await releaseSamplePayment(sampleReleaseModal.jobId, sampleReleaseModal.otp.trim());
      if (result.requiresOtp) {
        // Still awaiting confirmation (e.g. code expired) — let the admin request a fresh one
        setSampleReleaseModal((p) => ({ ...p, otp: '', otpError: result.message || 'Still awaiting confirmation — request a new OTP and try again.' }));
        return;
      }
      const breakdown = result.data?.breakdown || null;
      setSampleReleaseResult(breakdown);
      setSampleReleaseModal(SAMPLE_RELEASE_MODAL_INITIAL);
      await loadData();
      showToast(result.message || 'Sample payment confirmed.');
    } catch (err) {
      setSampleReleaseModal((p) => ({ ...p, otpError: err?.response?.data?.message || 'Incorrect OTP. Please try again.' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawModal.amount);
    if (!amt || amt <= 0) { setWithdrawError('Enter a valid amount.'); return; }
    setWithdrawLoading(true); setWithdrawError(''); setWithdrawSuccess('');
    try {
      const result = await createAdminPayout({ amount: amt, note: withdrawModal.note });
      if (result.requiresOtp) {
        // App-level OTP sent to admin email — switch modal to OTP entry step
        setWithdrawModal((prev) => ({ ...prev, otpStep: true, payoutId: result.data?.payoutId, otp: '' }));
        setWithdrawError('');
      } else if (result.success) {
        setWithdrawSuccess(result.message || 'Withdrawal initiated successfully.');
        const earnings = await getAdminEarnings();
        setAdminEarnings(earnings);
        setTimeout(() => {
          setWithdrawModal({ open: false, amount: '', note: '', otpStep: false, payoutId: null, otp: '' });
          setWithdrawSuccess('');
        }, 2500);
      } else {
        setWithdrawError(result.message || 'Withdrawal failed.');
      }
    } catch (err) {
      setWithdrawError(err?.response?.data?.message || 'Failed to initiate withdrawal.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleOtpConfirm = async () => {
    if (!withdrawModal.otp.trim()) { setWithdrawError('Enter the OTP from your email.'); return; }
    setWithdrawLoading(true); setWithdrawError(''); setWithdrawSuccess('');
    try {
      const result = await createAdminPayout({ amount: Number(withdrawModal.amount), note: withdrawModal.note, otp: withdrawModal.otp.trim() });
      if (result.requiresOtp) {
        // Still awaiting confirmation (e.g. code expired) — let the admin request a fresh one
        setWithdrawModal((prev) => ({ ...prev, otp: '' }));
        setWithdrawError(result.message || 'Still awaiting confirmation — request a new OTP and try again.');
        return;
      }
      if (result.success) {
        setWithdrawSuccess(result.message || 'Transfer confirmed.');
        const earnings = await getAdminEarnings();
        setAdminEarnings(earnings);
        setTimeout(() => {
          setWithdrawModal({ open: false, amount: '', note: '', otpStep: false, payoutId: null, otp: '' });
          setWithdrawSuccess('');
        }, 2500);
      } else {
        setWithdrawError(result.message || 'OTP verification failed.');
      }
    } catch (err) {
      setWithdrawError(err?.response?.data?.message || 'Incorrect OTP. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleResyncPayment = async (paymentId) => {
    setResyncingId(paymentId);
    try {
      const res = await resyncPayment(paymentId);
      showToast(res.message, !res.success);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to verify payment with Paystack.', true);
    } finally {
      setResyncingId(null);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await markInvoicePaid(invoiceId);
      await loadData();
      showToast('Invoice marked as paid. Order closed.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark invoice paid.', true);
    }
  };

  return (
    <AdminRoute>
      <PageWrapper title="Escrow & Payment Management" subtitle="Manage escrow releases and invoice payments">

        {/* Toast — fixed over modal so it's always visible */}
        {toast.msg && (
          <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl border transition-all ${
            toast.isError
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <span className="text-base">{toast.isError ? '✕' : '✓'}</span>
            {toast.msg}
          </div>
        )}

        {/* ── Pending Payment Verification ── */}
        {/* Payments stuck at PENDING/OTP_PENDING because their Paystack webhook never
            arrived (e.g. a signature-secret mismatch) even though Paystack may have
            already resolved the transfer. "Verify Payment" re-checks directly against
            Paystack's Verify Transfer endpoint and applies the outcome if conclusive. */}
        {pendingPayments.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/60 px-5 py-3">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Pending Payment Verification ({pendingPayments.length})
              </p>
              <p className="ml-2 text-[11px] text-blue-500">
                Awaiting Paystack webhook confirmation — verify directly if a transfer has already gone through.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-50 bg-blue-50/30">
                    {['Order', 'Artisan', 'Stage', 'Amount', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-blue-700 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {pendingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-bold text-leather">{p.orderRef}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">{p.artisanName}</td>
                      <td className="px-4 py-3 text-xs text-[#5A4A44]">{STAGE_SHORT_MAP[p.stage] || p.stage}</td>
                      <td className="px-4 py-3 font-bold text-ink whitespace-nowrap">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${
                          p.status === 'OTP_PENDING' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.status === 'OTP_PENDING' ? 'OTP Pending' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleResyncPayment(p.id)}
                          disabled={resyncingId === p.id}
                          className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          <ShieldCheck className={`h-3.5 w-3.5 ${resyncingId === p.id ? 'animate-pulse' : ''}`} />
                          {resyncingId === p.id ? 'Checking…' : 'Verify Payment'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'production', label: 'Production Escrow' },
              { id: 'sample',     label: 'Sample Payments' },
              { id: 'admin',      label: 'Admin Commission' },
              { id: 'vat',        label: 'VAT (FIRS)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-leather text-white'
                    : 'bg-[#F4EFEA] text-[#6A5B54] hover:bg-atmosphere'
                }`}
              >
                {tab.label}
                {tab.id === 'sample' && pendingSampleJobs.length > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>{pendingSampleJobs.length} pending</span>
                )}
                {tab.id === 'admin' && adminEarnings.outstanding > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>withdraw</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#E8DED5] bg-white px-3 py-2 text-sm font-medium text-[#6A5B54] hover:bg-atmosphere"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Headline stats */}
        {activeTab === 'production' && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-gold p-5 text-espresso shadow-sm">
              <p className="text-sm font-medium">Total Held in Escrow</p>
              <p className="mt-2 text-2xl font-extrabold">{formatCurrency(totals.totalEscrow)}</p>
            </div>
            <div className="rounded-2xl bg-leather p-5 text-white shadow-sm">
              <p className="text-sm font-medium">Admin Commission</p>
              <p className="mt-2 text-2xl font-extrabold">{formatCurrency(totals.totalCommission)}</p>
            </div>
            <div className="rounded-2xl bg-success p-5 text-white shadow-sm">
              <p className="text-sm font-medium">Released to Artisans</p>
              <p className="mt-2 text-2xl font-extrabold">{formatCurrency(totals.totalReleased)}</p>
            </div>
          </div>
        )}

        {activeTab === 'vat' && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Total VAT Collected</p>
              </div>
              <p className="text-2xl font-extrabold text-blue-900">{formatCurrency(vatData.summary.totalVat || 0)}</p>
              <p className="mt-1 text-xs text-blue-500">From completed samples &amp; delivered production orders</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-emerald-700 mb-2">Total Remitted to FIRS</p>
              <p className="text-2xl font-extrabold text-emerald-900">{formatCurrency(vatData.summary.totalRemitted || 0)}</p>
              <p className="mt-1 text-xs text-emerald-500">Logged remittances</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-700 mb-2">Outstanding to Remit</p>
              <p className="text-2xl font-extrabold text-amber-900">{formatCurrency(vatData.summary.outstanding || 0)}</p>
              <p className="mt-1 text-xs text-amber-500">Collected but not yet remitted</p>
            </div>
          </div>
        )}


        {/* Loading spinner */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : activeTab === 'production' ? (
          /* ── Production Escrow Table ── */
          (() => {
            // Include true PRODUCTION orders + legacy PATH A: SAMPLE orders that
            // received the production escrow payment (escrowBalance > 0).
            const productionPayments = payments.filter(
              (p) => p.type === 'PRODUCTION' || (p.type === 'SAMPLE' && (p.escrowBalance || 0) > 0)
            );
            return productionPayments.length === 0 ? (
              <div className="rounded-3xl border border-[#E8DED5] bg-white p-16 text-center text-[#A39289]">
                No production escrow payments yet. Payments appear here once brands complete production payment.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                        {['Order', 'Brand', 'Brand Paid', 'VAT (7.5%)', 'Escrow Balance', 'Admin Comm', 'Stage 1', 'Stage 2', 'Escrow Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4EFEA]">
                      {productionPayments.map((payment) => {
                        // Brand Paid / VAT are historical facts about what the brand was charged —
                        // they must stay fixed regardless of how much of that money has since been
                        // released to the artisan. Derive both from productionBase (stable, doesn't
                        // decrement) rather than escrowBalance (which now draws down on release).
                        const productionBase = productionBaseFor(payment);
                        const breakdown   = splitProduction(productionBase, snapshotSettingsFor(payment));
                        const vatAmount   = Math.floor(productionBase * 0.075);
                        const brandPaid   = productionBase + vatAmount;
                        const adminComm   = breakdown?.adminCommission || 0;
                        const canStage1   = !payment.stage1Released && payment.escrowBalance > 0;
                        const canStage2   = !payment.stage2Released && payment.stage1Released;
                        const escrowStatusColor = {
                          'Released':           'success',
                          'Partially Released': 'warning',
                          'Held':               'info',
                          'Pending':            'default',
                        }[payment.escrowStatus] || 'default';

                        const stage1Ready = canStage1 && payment.jobStatus === 'IN_PROGRESS';
                        const stage2Ready = canStage2 && ['PENDING_DELIVERY', 'COMPLETED', 'DELIVERED'].includes(payment.jobStatus);

                        return (
                          <tr key={payment.id} className="hover:bg-atmosphere/20 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="font-mono text-xs font-bold text-leather">{payment.orderRef || `#${payment.orderId?.slice(0, 8).toUpperCase()}`}</p>
                              {payment.quoteRef && (
                                <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{payment.quoteRef}]</p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-ink">{payment.brand}</td>
                            <td className="px-4 py-3 font-semibold text-ink">
                              {formatCurrency(brandPaid)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-blue-700">
                              {formatCurrency(vatAmount)}
                            </td>
                            <td className="px-4 py-3 text-[#5A4A44]">
                              {formatCurrency(payment.escrowBalance)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-leather">
                              {adminComm ? formatCurrency(adminComm) : '—'}
                            </td>
                            <td className="px-4 py-3 text-[#5A4A44]">
                              {breakdown ? formatCurrency(breakdown.stage1Amount || 0) : '—'}
                              {payment.stage1Released && (
                                <span className="ml-1 text-[10px] font-bold text-emerald-600">✓</span>
                              )}
                              {stage1Ready && !payment.stage1Released && (
                                <span className="ml-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 align-middle">
                                  READY
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#5A4A44]">
                              {breakdown ? formatCurrency(breakdown.stage2Amount || 0) : '—'}
                              {payment.stage2Released && (
                                <span className="ml-1 text-[10px] font-bold text-emerald-600">✓</span>
                              )}
                              {stage2Ready && !payment.stage2Released && (
                                <span className="ml-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 align-middle">
                                  READY
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={escrowStatusColor}>{payment.escrowStatus}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {canStage1 && (
                                  <button
                                    onClick={() => openConfirm(payment, 1)}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors whitespace-nowrap ${
                                      stage1Ready
                                        ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                                        : 'bg-leather hover:bg-leather/80'
                                    }`}
                                  >
                                    {stage1Ready ? '⚡ Release S1' : 'Release S1'}
                                  </button>
                                )}
                                {canStage2 && (
                                  <button
                                    onClick={() => openConfirm(payment, 2)}
                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors whitespace-nowrap ${
                                      stage2Ready
                                        ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                                        : 'bg-success hover:bg-success/80'
                                    }`}
                                  >
                                    {stage2Ready ? '⚡ Release S2' : 'Release S2'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        ) : activeTab === 'admin' ? (
          /* ── Admin Commission Tab ── */
          <div className="space-y-6">

            {/* Hero card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-800 via-amber-700 to-leather p-8 text-white shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-amber-300" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Admin Commission</p>
                </div>
                <p className="text-4xl font-extrabold tracking-tight">{formatCurrency(adminEarnings.totalEarned)}</p>
                <p className="mt-1 text-sm text-amber-200">Total commission earned from all orders</p>
              </div>
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
              <div className="absolute -right-2 -bottom-10 h-32 w-32 rounded-full bg-white/5" />
            </div>

            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Withdrawn</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-800">{formatCurrency(adminEarnings.totalWithdrawn)}</p>
                <p className="mt-1 text-[11px] text-emerald-500">{adminEarnings.payoutCount ?? 0} payout{(adminEarnings.payoutCount ?? 0) !== 1 ? 's' : ''}</p>
              </div>
              <div className={`rounded-2xl border p-5 shadow-sm ${adminEarnings.outstanding > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${adminEarnings.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>Available to Withdraw</p>
                <p className={`mt-2 text-2xl font-extrabold ${adminEarnings.outstanding > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>{formatCurrency(adminEarnings.outstanding)}</p>
                <p className={`mt-1 text-[11px] ${adminEarnings.outstanding > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {adminEarnings.outstanding > 0 ? 'Ready to transfer' : 'All withdrawn ✓'}
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-[#E8DED5] bg-white p-5 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289]">Next Withdrawal</p>
                  <p className="mt-2 text-2xl font-extrabold text-leather">{formatCurrency(adminEarnings.outstanding)}</p>
                  <p className="mt-1 text-[11px] text-[#A39289]">Available now</p>
                </div>
                <button
                  onClick={() => setWithdrawModal({ open: true, amount: String(adminEarnings.outstanding || ''), note: '' })}
                  disabled={adminEarnings.outstanding <= 0}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-leather px-4 py-3 text-sm font-bold text-white hover:bg-leather/90 disabled:opacity-40 transition-all shadow-sm"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  Withdraw Commission
                </button>
              </div>
            </div>

            {/* Withdrawal history */}
            <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-[#F4EFEA] px-6 py-4">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-bold text-ink">Withdrawal History</p>
                </div>
                <button
                  onClick={() => setWithdrawModal({ open: true, amount: String(adminEarnings.outstanding || ''), note: '' })}
                  disabled={adminEarnings.outstanding <= 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-40 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> New Withdrawal
                </button>
              </div>

              {(!adminEarnings.payouts || adminEarnings.payouts.length === 0) ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                    <ArrowDownToLine className="h-6 w-6 text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-ink">No withdrawals yet</p>
                  <p className="mt-1 text-xs text-[#A39289]">Your commission builds up here — withdraw to your bank account anytime.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F4EFEA]">
                  {adminEarnings.payouts.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        p.status === 'SUCCESS'     ? 'bg-emerald-100' :
                        p.status === 'FAILED'      ? 'bg-red-100' :
                        p.status === 'OTP_PENDING' ? 'bg-blue-100' : 'bg-amber-100'
                      }`}>
                        {p.status === 'SUCCESS'     && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                        {p.status === 'FAILED'      && <AlertCircle className="h-5 w-5 text-red-500" />}
                        {p.status === 'OTP_PENDING' && <AlertCircle className="h-5 w-5 text-blue-500" />}
                        {p.status === 'INITIATED'   && <Clock className="h-5 w-5 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-ink">{formatCurrency(p.amount)}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === 'SUCCESS'     ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'FAILED'      ? 'bg-red-100 text-red-600' :
                            p.status === 'OTP_PENDING' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{p.status === 'OTP_PENDING' ? 'OTP Required' : p.status}</span>
                        </div>
                        <p className="text-xs text-[#A39289] mt-0.5 truncate">
                          {p.bankName && `${p.bankName} · ${p.accountNumber}`}
                          {p.note && ` · ${p.note}`}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-[#A39289]">{formatDate(p.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Withdraw modal */}
            {withdrawModal.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="border-b border-[#F4EFEA] bg-gradient-to-r from-amber-50 to-[#FFF8EA] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                        <ArrowDownToLine className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-ink">
                          {withdrawModal.otpStep ? 'Enter OTP to Confirm' : 'Withdraw Commission'}
                        </h3>
                        <p className="text-xs text-[#A39289]">
                          {withdrawModal.otpStep
                            ? 'We sent a one-time code to your email'
                            : 'Transfer your earnings to your bank account'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {withdrawModal.otpStep ? (
                      /* ── OTP Step ── */
                      <>
                        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                          <p className="text-sm text-blue-800">
                            Check your <strong>email</strong> for an OTP and enter it below to authorise the transfer.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide text-[#A39289] mb-1.5">One-Time Password (OTP)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            autoFocus
                            value={withdrawModal.otp}
                            onChange={(e) => setWithdrawModal((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
                            placeholder="e.g. 123456"
                            className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.5em] text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                          />
                        </div>

                        <p className="text-center text-xs text-[#A39289]">
                          Amount: <strong className="text-ink">{formatCurrency(Number(withdrawModal.amount))}</strong>
                        </p>
                      </>
                    ) : (
                      /* ── Amount / Note Step ── */
                      <>
                        {/* Earnings snapshot */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label: 'Total Earned',  value: formatCurrency(adminEarnings.totalEarned),    cls: 'text-ink' },
                            { label: 'Withdrawn',     value: formatCurrency(adminEarnings.totalWithdrawn), cls: 'text-emerald-700' },
                            { label: 'Available',     value: formatCurrency(adminEarnings.outstanding),    cls: 'text-amber-700 font-extrabold text-base' },
                          ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-[#F4EFEA] bg-[#FDFAF8] px-2 py-3">
                              <p className="text-[9px] font-bold uppercase tracking-wide text-[#A39289]">{item.label}</p>
                              <p className={`mt-1 text-sm font-bold ${item.cls}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Destination account */}
                        {adminEarnings.payouts?.[0] ? (
                          <div className="flex items-center gap-3 rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-atmosphere shrink-0">
                              <Building2 className="h-4 w-4 text-leather" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A39289]">Destination Account</p>
                              <p className="text-sm font-bold text-ink">{adminEarnings.payouts[0].accountName}</p>
                              <p className="text-xs text-[#A39289]">{adminEarnings.payouts[0].bankName} · {adminEarnings.payouts[0].accountNumber}</p>
                            </div>
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-xs text-amber-700">No bank account saved yet. Add your bank details in <strong>Profile</strong> first.</p>
                          </div>
                        )}

                        {/* Amount input */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide text-[#A39289] mb-1.5">Amount to Withdraw</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#A39289]">₦</span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={withdrawModal.amount}
                              onChange={(e) => setWithdrawModal((p) => ({ ...p, amount: e.target.value }))}
                              className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] pl-8 pr-4 py-3.5 text-lg font-extrabold text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                              placeholder="0"
                            />
                          </div>
                          {adminEarnings.outstanding > 0 && (
                            <button
                              type="button"
                              onClick={() => setWithdrawModal((p) => ({ ...p, amount: String(adminEarnings.outstanding) }))}
                              className="mt-1.5 text-[11px] font-semibold text-amber-700 hover:underline"
                            >
                              Use full available amount ({formatCurrency(adminEarnings.outstanding)})
                            </button>
                          )}
                        </div>

                        {/* Note */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide text-[#A39289] mb-1.5">Note <span className="font-normal">(optional)</span></label>
                          <input
                            type="text"
                            value={withdrawModal.note}
                            onChange={(e) => setWithdrawModal((p) => ({ ...p, note: e.target.value }))}
                            placeholder="e.g. June 2026 commission"
                            className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3 text-sm text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                          />
                        </div>
                      </>
                    )}

                    {withdrawError && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {withdrawError}
                      </div>
                    )}
                    {withdrawSuccess && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {withdrawSuccess}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 border-t border-[#F4EFEA] bg-[#FDFAF8] px-6 py-4">
                    <button
                      onClick={() => { setWithdrawModal({ open: false, amount: '', note: '', otpStep: false, payoutId: null, otp: '' }); setWithdrawError(''); setWithdrawSuccess(''); }}
                      className="flex-1 rounded-xl border border-[#E8DED5] py-3 text-sm font-semibold text-[#6A5B54] hover:bg-atmosphere transition-colors"
                    >
                      Cancel
                    </button>
                    {withdrawModal.otpStep ? (
                      <button
                        onClick={handleOtpConfirm}
                        disabled={withdrawLoading || withdrawModal.otp.length < 4 || !!withdrawSuccess}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-3 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {withdrawLoading
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                          : <><CheckCircle2 className="h-4 w-4" /> Confirm OTP</>
                        }
                      </button>
                    ) : (
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawLoading || !Number(withdrawModal.amount) || !!withdrawSuccess}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 py-3 text-sm font-bold text-white hover:bg-amber-800 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {withdrawLoading
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                          : <><ArrowDownToLine className="h-4 w-4" /> Confirm Withdrawal</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        ) : activeTab === 'vat' ? (
          /* ── VAT / FIRS Tab ── */
          (() => {
            const totalVatCollected  = vatData.summary.totalVat || 0;
            const totalVatRemitted   = firsRemittances.reduce((s, r) => s + r.amount, 0);
            const outstanding        = Math.max(0, totalVatCollected - totalVatRemitted);

            const handleRemit = async () => {
              const amt = Number(firsModal.amount);
              if (!amt || amt <= 0) return;
              setFirsLoading(true);
              try {
                const record = await createFIRSRemittance({ amount: amt, note: firsModal.note });
                setFirsRemittances((prev) => [record, ...prev]);
                setFirsModal({ open: false, amount: '', note: '' });
                showToast('FIRS remittance recorded successfully.');
              } catch (err) {
                showToast(err?.response?.data?.message || 'Failed to record remittance.', true);
              } finally {
                setFirsLoading(false);
              }
            };

            return (
              <div className="space-y-5">
                {/* Info banner */}
                <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <Landmark className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                  <span>
                    VAT is charged at <strong>7.5%</strong> on every brand invoice (FIRS standard rate).
                    Use the button below to log each real-world remittance to FIRS — this app does not
                    make the payment; it just keeps the record.
                  </span>
                </div>

                {/* Mark remitted button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setFirsModal({ open: true, amount: String(outstanding || ''), note: '' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Mark Remitted to FIRS
                  </button>
                </div>

                {/* VAT invoice table */}
                {vatData.records.length === 0 ? (
                  <div className="rounded-3xl border border-[#E8DED5] bg-white p-16 text-center text-[#A39289]">
                    No invoices generated yet.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                    <div className="border-b border-[#F4EFEA] px-5 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">VAT by Invoice</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                            {['Order Ref', 'Brand', 'Type', 'Base Amount', 'VAT (7.5%)', 'Invoice Total', 'Invoice Status', 'Date'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289] whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4EFEA]">
                          {vatData.records.map((r) => (
                            <tr key={r.id} className="hover:bg-atmosphere/20 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs font-bold text-leather whitespace-nowrap">#{r.orderRef}</td>
                              <td className="px-4 py-3 font-medium text-ink">{r.brandName}</td>
                              <td className="px-4 py-3">
                                <Badge variant={r.orderType === 'SAMPLE' ? 'warning' : 'info'}>{r.orderType}</Badge>
                              </td>
                              <td className="px-4 py-3 text-[#5A4A44]">{formatCurrency(r.baseAmount)}</td>
                              <td className="px-4 py-3 font-semibold text-blue-700">{formatCurrency(r.vatAmount)}</td>
                              <td className="px-4 py-3 font-bold text-ink">{formatCurrency(r.grandTotal)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                  r.isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                  {r.isPaid ? '✓ Paid' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-[#A39289] whitespace-nowrap">{formatDate(r.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="border-t border-[#F4EFEA] px-4 py-2 flex items-center justify-between text-xs text-[#A39289]">
                        <span>{vatData.records.length} invoices</span>
                        <span className="font-semibold text-blue-700">Total VAT: {formatCurrency(totalVatCollected)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Remittance log */}
                <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#F4EFEA] px-5 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">FIRS Remittance Log</p>
                    <span className="text-xs text-[#A39289]">{firsRemittances.length} record{firsRemittances.length !== 1 ? 's' : ''}</span>
                  </div>
                  {firsRemittances.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-[#A39289]">No remittances recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-[#F4EFEA]">
                      {firsRemittances.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-ink">{formatCurrency(r.amount)}</p>
                            {r.note && <p className="text-xs text-[#A39289] truncate">{r.note}</p>}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#A39289] shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDate(r.remittedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remittance modal */}
                {firsModal.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                      <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                          <Landmark className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-ink">Record FIRS Remittance</h3>
                          <p className="text-xs text-[#A39289]">Log a real-world VAT payment to FIRS</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1.5">Amount Remitted (₦)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#A39289]">₦</span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={firsModal.amount}
                              onChange={(e) => setFirsModal((p) => ({ ...p, amount: e.target.value }))}
                              className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] pl-7 pr-4 py-3 text-sm font-bold text-ink outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              placeholder="0"
                            />
                          </div>
                          {outstanding > 0 && (
                            <button
                              type="button"
                              onClick={() => setFirsModal((p) => ({ ...p, amount: String(outstanding) }))}
                              className="mt-1 text-[11px] text-blue-600 hover:underline"
                            >
                              Use outstanding amount ({formatCurrency(outstanding)})
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1.5">Reference / Note <span className="font-normal">(optional)</span></label>
                          <input
                            type="text"
                            value={firsModal.note}
                            onChange={(e) => setFirsModal((p) => ({ ...p, note: e.target.value }))}
                            placeholder="e.g. FIRS TCC ref, period covered…"
                            className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3 text-sm text-ink outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setFirsModal({ open: false, amount: '', note: '' })}
                          className="flex-1 rounded-xl border border-[#E8DED5] py-2.5 text-sm font-semibold text-[#6A5B54] hover:bg-atmosphere transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRemit}
                          disabled={firsLoading || !Number(firsModal.amount)}
                          className="flex-1 rounded-xl bg-blue-700 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
                        >
                          {firsLoading ? 'Saving…' : 'Confirm & Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          /* ── Sample Payments Tab ── */
          <div className="space-y-6">

            {/* Pending releases */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#A39289]">
                Pending Release ({pendingSampleJobs.length})
              </h3>
              {pendingSampleJobs.length === 0 ? (
                <div className="rounded-2xl border border-[#E8DED5] bg-white p-8 text-center text-sm text-[#A39289]">
                  No sample jobs are awaiting payment release right now.
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-amber-100 bg-amber-50/60">
                          {['Order Ref', 'Brand', 'Product', 'Artisan', 'Action'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-amber-700 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-50">
                        {pendingSampleJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs font-bold text-leather">{job.orderRef}</p>
                              {job.quoteRef && (
                                <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{job.quoteRef}]</p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-ink">{job.brandName}</td>
                            <td className="px-4 py-3 text-[#5A4A44] text-xs">{job.productType}</td>
                            <td className="px-4 py-3 text-ink">{job.artisanName}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setSampleReleaseResult(null);
                                  setSampleAlreadyReleased(false);
                                  setSampleReleaseModal({ open: true, jobId: job.id, artisan: job.artisanName, orderRef: job.orderRef, flatFee: job.flatFeePaid || 0, brandPaidTotal: job.brandPaidTotal || 0, bankDetail: job.artisanBankDetail || null, hasBankDetails: job.artisanHasBankDetails || false });
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors whitespace-nowrap"
                              >
                                <NairaIcon className="h-3.5 w-3.5" /> Release {100 - (settings?.sampleAdminRate ?? 30)}%
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>


          </div>
        )}

        {/* Sample payment release modal */}
        {(() => {
          const flatFee          = sampleReleaseModal.flatFee || 0;
          // settings.sampleAdminRate is a % integer (e.g. 30), convert to decimal
          const sampleAdminRate  = (settings?.sampleAdminRate ?? 30) / 100;
          const artisanRate      = 1 - sampleAdminRate;
          const artisanAmt    = Math.round(artisanRate * flatFee);
          const adminAmt      = Math.round(sampleAdminRate * flatFee);
          const vatAmt        = Math.round(0.075 * flatFee);
          const brandTotal    = sampleReleaseModal.brandPaidTotal || 0;
          const fmt           = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
          const bankDetail    = sampleReleaseModal.bankDetail;
          const hasBankDetails = sampleReleaseModal.hasBankDetails;
          return (
            <Modal
              title={`Release Sample Payment (${Math.round(artisanRate * 100)}%)`}
              open={sampleReleaseModal.open}
              onClose={() => { setSampleReleaseModal(SAMPLE_RELEASE_MODAL_INITIAL); setSampleAlreadyReleased(false); }}
            >
              <div className="space-y-4">

                {/* Order header */}
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Order</p>
                    <p className="text-sm font-bold text-ink">{sampleReleaseModal.orderRef}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Artisan</p>
                    <p className="text-sm font-bold text-ink">{sampleReleaseModal.artisan}</p>
                  </div>
                </div>

                {sampleReleaseModal.otpStep ? (
                  /* ── OTP Step ── */
                  <>
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Check the admin&apos;s <strong>email</strong> for an OTP and enter it below to authorise this transfer.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#A39289] mb-1.5">One-Time Password (OTP)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={sampleReleaseModal.otp}
                        onChange={(e) => setSampleReleaseModal((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
                        placeholder="e.g. 123456"
                        className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.5em] text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                      />
                    </div>

                    {sampleReleaseModal.otpError && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {sampleReleaseModal.otpError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleSampleOtpConfirm}
                        disabled={actionLoading || sampleReleaseModal.otp.length < 4}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {actionLoading
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                          : <><CheckCircle2 className="h-4 w-4" /> Confirm OTP</>
                        }
                      </button>
                      <button
                        onClick={() => { setSampleReleaseModal(SAMPLE_RELEASE_MODAL_INITIAL); setSampleAlreadyReleased(false); }}
                        className="flex-1 rounded-xl border border-[#E8DED5] bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-atmosphere transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                {/* Artisan bank account status */}
                {hasBankDetails ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="text-emerald-600 text-base leading-none mt-0.5">✓</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Bank Account Verified</p>
                      <p className="text-sm font-semibold text-stone-900 mt-0.5">{bankDetail?.accountName}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {bankDetail?.bankName} · {bankDetail?.accountNumber}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <span className="text-red-500 text-base leading-none mt-0.5">✕</span>
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide">No Bank Account on File</p>
                      <p className="text-sm text-red-600 mt-0.5">
                        This artisan has not added their bank details yet. Payment cannot be released.
                      </p>
                    </div>
                  </div>
                )}

                {/* Money breakdown */}
                <div className="rounded-xl border border-[#E8DED5] bg-white overflow-hidden">
                  {/* Brand paid */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA] bg-atmosphere/30">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">Brand Paid (incl. VAT)</p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Total received from brand</p>
                    </div>
                    <p className="text-base font-extrabold text-ink">{fmt(brandTotal || flatFee)}</p>
       
                  </div>
                  {/* Flat fee base */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">Sample Flat Fee (base)</p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Pre-VAT base amount</p>
                    </div>
                    <p className="text-sm font-bold text-ink">{fmt(flatFee)}</p>
                  </div>
                  {/* Artisan share */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA] bg-emerald-50/40">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">→ Artisan Share (70%)</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">Transferred via Paystack</p>
                    </div>
                    <p className="text-base font-extrabold text-emerald-700">{fmt(artisanAmt)}</p>
                  </div>
                  {/* Admin commission */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-leather">→ Admin Commission (30%)</p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Retained by Leddar</p>
                    </div>
                    <p className="text-base font-extrabold text-leather">{fmt(adminAmt)}</p>
                  </div>
                  {/* VAT */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">→ VAT (7.5%)</p>
                      <p className="text-[11px] text-blue-500 mt-0.5">Remitted to FIRS</p>
                    </div>
                    <p className="text-base font-extrabold text-blue-700">{fmt(vatAmt)}</p>
                  </div>
                </div>

                {/* Already released banner */}
                {sampleAlreadyReleased && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="text-emerald-600 text-lg">✓</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Payment already released</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{fmt(artisanAmt)} was previously sent to {sampleReleaseModal.artisan}</p>
                    </div>
                  </div>
                )}

                {!sampleAlreadyReleased && (
                  <p className="text-xs text-[#A39289] text-center">
                    This will transfer the artisan&apos;s share via Paystack. <strong className="text-ink">Cannot be undone.</strong>
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleReleaseSamplePayment}
                    disabled={actionLoading || sampleAlreadyReleased || !hasBankDetails}
                    title={!hasBankDetails ? 'Artisan must add bank details before payment can be released' : ''}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <NairaIcon className="h-4 w-4" />
                    {actionLoading
                      ? 'Releasing…'
                      : sampleAlreadyReleased
                      ? `Already released ${fmt(artisanAmt)} to Artisan`
                      : `Release ${fmt(artisanAmt)} to Artisan`}
                  </button>
                  <button
                    onClick={() => { setSampleReleaseModal(SAMPLE_RELEASE_MODAL_INITIAL); setSampleAlreadyReleased(false); }}
                    className="flex-1 rounded-xl border border-[#E8DED5] bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-atmosphere transition-colors"
                  >
                    {sampleAlreadyReleased ? 'Close' : 'Cancel'}
                  </button>
                </div>
                  </>
                )}
              </div>
            </Modal>
          );
        })()}

        {/* ── Production release modal — rich design ── */}
        {(() => {
          const { stage, amount, artisan, orderRef, escrowBalance, breakdown, bankDetail, hasBankDetails } = confirmModal;
          const fmt       = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;
          const isStage1  = stage === 1;
          const adminCut  = breakdown?.adminCommission || 0;
          const s1Amount  = breakdown?.stage1Amount || 0;
          const s2Amount  = breakdown?.stage2Amount || 0;
          const s1Pct     = breakdown?.stage1Percent || 0;
          const s2Pct     = breakdown?.stage2Percent || 0;
          const adminPct  = breakdown?.adminPercent  || 0;

          return (
            <Modal
              title={`Release Stage ${stage} Payment`}
              open={confirmModal.open}
              onClose={() => setConfirmModal(CONFIRM_MODAL_INITIAL)}
            >
              <div className="space-y-4">

                {/* Order + Artisan header */}
                <div className="flex items-center justify-between rounded-xl border border-[#E8DED5] bg-atmosphere/50 px-4 py-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Order</p>
                    <p className="text-sm font-bold text-ink">{orderRef}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-[#A39289]">Artisan</p>
                    <p className="text-sm font-bold text-ink">{artisan}</p>
                  </div>
                </div>

                {confirmModal.otpStep ? (
                  /* ── OTP Step ── */
                  <>
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Check the admin&apos;s <strong>email</strong> for an OTP and enter it below to authorise this transfer.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#A39289] mb-1.5">One-Time Password (OTP)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={confirmModal.otp}
                        onChange={(e) => setConfirmModal((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
                        placeholder="e.g. 123456"
                        className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.5em] text-ink outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                      />
                    </div>

                    {confirmModal.otpError && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {confirmModal.otpError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleStageOtpConfirm}
                        disabled={actionLoading || confirmModal.otp.length < 4}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 transition-colors shadow-sm ${
                          isStage1 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {actionLoading
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                          : <><CheckCircle2 className="h-4 w-4" /> Confirm OTP</>
                        }
                      </button>
                      <button
                        onClick={() => setConfirmModal(CONFIRM_MODAL_INITIAL)}
                        className="flex-1 rounded-xl border border-[#E8DED5] bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-atmosphere transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                {/* Stage badge */}
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  isStage1
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-emerald-200 bg-emerald-50'
                }`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                    isStage1 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}>
                    {stage}
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${isStage1 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isStage1 ? 'Raw Materials Payment' : 'Service Fee Payment'}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isStage1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isStage1
                        ? 'Released before production starts — covers artisan raw material costs.'
                        : 'Released after job is Completed — covers artisan service fee.'}
                    </p>
                  </div>
                </div>

                {/* Bank account status */}
                {hasBankDetails ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="text-emerald-600 text-base leading-none mt-0.5">✓</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Bank Account Verified</p>
                      <p className="text-sm font-semibold text-stone-900 mt-0.5">{bankDetail?.accountName}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {bankDetail?.bankName} · {bankDetail?.accountNumber}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <span className="text-red-500 text-base leading-none mt-0.5">✕</span>
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide">No Bank Account on File</p>
                      <p className="text-sm text-red-600 mt-0.5">
                        This artisan has not added their bank details. Payment cannot be released.
                      </p>
                    </div>
                  </div>
                )}

                {/* Money breakdown table */}
                <div className="rounded-xl border border-[#E8DED5] bg-white overflow-hidden">
                  {/* Total escrow */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA] bg-atmosphere/30">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">Total Held in Escrow</p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Production payment from brand</p>
                    </div>
                    <p className="text-base font-extrabold text-ink">{fmt(escrowBalance)}</p>
                  </div>
                  {/* Stage 1 */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA] ${isStage1 ? 'bg-amber-50/60' : ''}`}>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${isStage1 ? 'text-amber-700' : 'text-[#A39289]'}`}>
                        → Stage 1 · Raw Materials ({s1Pct}%)
                        {isStage1 && <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">THIS RELEASE</span>}
                      </p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Artisan covers material costs</p>
                    </div>
                    <p className={`text-base font-extrabold ${isStage1 ? 'text-amber-700' : 'text-[#5A4A44]'}`}>{fmt(s1Amount)}</p>
                  </div>
                  {/* Stage 2 */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b border-[#F4EFEA] ${!isStage1 ? 'bg-emerald-50/60' : ''}`}>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider ${!isStage1 ? 'text-emerald-700' : 'text-[#A39289]'}`}>
                        → Stage 2 · Service Fee ({s2Pct}%)
                        {!isStage1 && <span className="ml-1.5 rounded-full bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">THIS RELEASE</span>}
                      </p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Released after job completion</p>
                    </div>
                    <p className={`text-base font-extrabold ${!isStage1 ? 'text-emerald-700' : 'text-[#5A4A44]'}`}>{fmt(s2Amount)}</p>
                  </div>
                  {/* Admin commission */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-leather">→ Admin Commission ({adminPct}%)</p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">Retained by Leddar</p>
                    </div>
                    <p className="text-base font-extrabold text-leather">{fmt(adminCut)}</p>
                  </div>
                </div>

                <p className="text-xs text-[#A39289] text-center">
                  Transferring <strong className="text-ink">{fmt(amount)}</strong> to {artisan} via Paystack. <strong className="text-ink">Cannot be undone.</strong>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={confirmRelease}
                    disabled={actionLoading || !hasBankDetails}
                    title={!hasBankDetails ? 'Artisan must add bank details first' : ''}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isStage1 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <NairaIcon className="h-4 w-4" />
                    {actionLoading
                      ? <span className="flex items-center gap-2"><Spinner size="sm" /> Releasing…</span>
                      : `Release ${fmt(amount)} to Artisan`
                    }
                  </button>
                  <button
                    onClick={() => setConfirmModal(CONFIRM_MODAL_INITIAL)}
                    className="flex-1 rounded-xl border border-[#E8DED5] bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-atmosphere transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                  </>
                )}

              </div>
            </Modal>
          );
        })()}
      </PageWrapper>
    </AdminRoute>
    );
}
