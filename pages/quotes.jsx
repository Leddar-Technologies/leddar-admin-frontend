import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import Spinner from '@/components/ui/Spinner';
import QuoteRow from '@/components/admin/QuoteRow';
import AdminRoute from '@/components/auth/AdminRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getQuotes, respondToQuote, updateQuoteStatus, getPresignedUrl } from '@/services/quotesService';
import { getCommissionSettings } from '@/services/commissionService';
import { AlertCircle, RefreshCw, FileText, Image, Film, ExternalLink, Eye } from 'lucide-react';

const TABS = ['All', 'Pending Response', 'Under Review', 'Approved', 'Paid'];

export default function QuotesPage() {
  const [rows, setRows]           = useState([]);
  const [settings, setSettings]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [toast, setToast]         = useState('');

  // Respond modal (admin prices the quote)
  const [respondModal, setRespondModal]   = useState({ open: false, quote: null });
  const [matPerUnit, setMatPerUnit]       = useState('');
  const [labPerUnit, setLabPerUnit]       = useState('');
  const [commPct, setCommPct]             = useState('');
  const [respondError, setRespondError]   = useState('');

  // Approve / reject confirmation modal
  const [reviewModal, setReviewModal]     = useState({ open: false, quote: null, action: null });

  // Detail modal
  const [detailModal, setDetailModal]     = useState({ open: false, quote: null });

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [quoteData, settingData] = await Promise.all([
        getQuotes(),
        getCommissionSettings(),
      ]);
      setRows(quoteData);
      setSettings(settingData);
    } catch (err) {
      showToast('Failed to load quotes: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ---------------------------------------------------------------------------
  // Tab filtering
  // ---------------------------------------------------------------------------
  const filteredRows = useMemo(() => {
    if (activeTab === 'Pending Response') return rows.filter((r) => r.status === 'SUBMITTED');
    if (activeTab === 'Under Review')     return rows.filter((r) => r.status === 'UNDER_REVIEW');
    if (activeTab === 'Approved')         return rows.filter((r) => r.status === 'APPROVED');
    if (activeTab === 'Paid')             return rows.filter((r) => r.status === 'APPROVED');
    return rows;
  }, [rows, activeTab]);

  // Badge counts for tabs
  const pendingCount   = rows.filter((r) => r.status === 'SUBMITTED').length;
  const reviewCount    = rows.filter((r) => r.status === 'UNDER_REVIEW').length;
  const approvedCount  = rows.filter((r) => r.status === 'APPROVED').length;

  // ---------------------------------------------------------------------------
  // Respond: admin sets pricing
  // ---------------------------------------------------------------------------
  const openRespond = (quote) => {
    setMatPerUnit('');
    setLabPerUnit('');
    setCommPct(settings?.adminRate ?? 15);
    setRespondError('');
    setRespondModal({ open: true, quote });
  };

  const submitRespond = async (e) => {
    e.preventDefault();
    const qty = Number(respondModal.quote?.quantity || 1);
    const mat = Number(matPerUnit || 0) * qty;
    const lab = Number(labPerUnit || 0) * qty;
    const pct = Number(commPct || 0);
    // Bake commission equally into both materials and labour
    const matWithComm = Math.round(mat * (1 + pct / 100));
    const labWithComm = Math.round(lab * (1 + pct / 100));
    const finalPrice  = matWithComm + labWithComm;
    if (!matPerUnit || Number(matPerUnit) <= 0) { setRespondError('Enter a valid materials cost per unit.'); return; }
    if (!labPerUnit || Number(labPerUnit) <= 0) { setRespondError('Enter a valid labour cost per unit.'); return; }
    if (pct < 0 || pct > 100) { setRespondError('Commission must be between 0 and 100%.'); return; }
    setActionLoading(true);
    setRespondError('');
    try {
      await respondToQuote({
        quoteId:   respondModal.quote.id,
        price:     finalPrice,
        materials: matWithComm,
        labour:    labWithComm,
      });
      setRespondModal({ open: false, quote: null });
      await loadData();
      showToast('✓ Quote sent to brand. Status is now Under Review.');
    } catch (err) {
      setRespondError(err.response?.data?.message || err.message || 'Failed to send quote.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Approve / reject
  // ---------------------------------------------------------------------------
  const openReview = (quote, action) => setReviewModal({ open: true, quote, action });
  const openDetail = async (quote) => {
    // Resolve pre-signed URLs for all files so private S3 objects are viewable
    let resolvedFiles = quote.files || [];
    if (resolvedFiles.length > 0) {
      resolvedFiles = await Promise.all(
        resolvedFiles.map(async (f) => {
          try {
            const signedUrl = await getPresignedUrl(f.url);
            return { ...f, url: signedUrl };
          } catch {
            return f; // fall back to original URL on error
          }
        })
      );
    }
    setDetailModal({ open: true, quote: { ...quote, files: resolvedFiles } });
  };

  const submitReview = async () => {
    if (!reviewModal.quote) return;
    setActionLoading(true);
    try {
      await updateQuoteStatus(reviewModal.quote.id, reviewModal.action);
      setReviewModal({ open: false, quote: null, action: null });
      await loadData();
      showToast(`✓ Quote ${reviewModal.action === 'APPROVED' ? 'approved' : 'rejected'}.`);
    } catch (err) {
      showToast('✗ ' + (err.response?.data?.message || 'Failed to update status.'), true);
    } finally {
      setActionLoading(false);
    }
  };

  // Auto-calculated pricing for respond modal
  const respondQty         = Number(respondModal.quote?.quantity || 1);
  const calcMaterials      = Math.round(Number(matPerUnit || 0) * respondQty);
  const calcLabour         = Math.round(Number(labPerUnit || 0) * respondQty);
  const calcBase           = calcMaterials + calcLabour;
  const calcCommPct        = Number(commPct || 0);
  const calcMatWithComm    = Math.round(calcMaterials * (1 + calcCommPct / 100));
  const calcLabWithComm    = Math.round(calcLabour    * (1 + calcCommPct / 100));
  const calcFinalPrice     = calcMatWithComm + calcLabWithComm;

  return (
    <AdminRoute>
      <PageWrapper title="Quote Management" subtitle="Review and respond to brand quote requests">

        {/* Toast */}
        {toast && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold border ${
            toast.isError
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>{toast.msg}</div>
        )}

        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const badge = tab === 'Pending Response' ? pendingCount
                : tab === 'Under Review' ? reviewCount
                : tab === 'Approved' || tab === 'Paid' ? approvedCount
                : null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab ? 'bg-leather text-white' : 'bg-[#F4EFEA] text-[#6A5B54] hover:bg-atmosphere'
                  }`}
                >
                  {tab}
                  {badge != null && badge > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeTab === tab ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>{badge}</span>
                  )}
                </button>
              );
            })}
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

        {/* Table */}
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
                    {['Order ID', 'Brand', 'Product', 'Date', 'Status', 'Price', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[#A39289]">No quotes found.</td>
                    </tr>
                  ) : filteredRows.map((quote) => (
                    <QuoteRow
                      key={quote.id}
                      quote={quote}
                      onRespond={openRespond}
                      onApprove={(q) => openReview(q, 'APPROVED')}
                      onReject={(q)  => openReview(q, 'REJECTED')}
                      onView={openDetail}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* RESPOND MODAL — admin sets pricing                               */}
        {/* ---------------------------------------------------------------- */}
        <Modal
          title="Respond to Quote Request"
          open={respondModal.open}
          onClose={() => setRespondModal({ open: false, quote: null })}
        >
          {respondModal.quote && (
            <div className="space-y-4">
              {/* Quote summary */}
              <div className="rounded-xl border border-[#E8DED5] bg-atmosphere p-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Brand</p>
                    <p className="font-bold text-ink">{respondModal.quote.brandName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Product</p>
                    <p className="font-medium text-ink">{respondModal.quote.productType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Quantity</p>
                    <p className="font-medium text-ink">{respondModal.quote.quantity || '—'}</p>
                  </div>
                </div>
                {respondModal.quote.notes && (
                  <div className="mt-2 border-t border-[#E8DED5] pt-2">
                    <p className="text-xs text-[#A39289] uppercase">Brand Notes</p>
                    <p className="text-sm text-ink mt-0.5">{respondModal.quote.notes}</p>
                  </div>
                )}
                {/* View full details button */}
                <button
                  type="button"
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#8B6A39] hover:underline"
                  onClick={() => {
                    setRespondModal({ open: false, quote: null });
                    openDetail(respondModal.quote);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View full quote details
                </button>
              </div>

              <form className="space-y-4" onSubmit={submitRespond}>

                {/* Per-unit cost inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">
                      Materials Cost per Unit (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={matPerUnit}
                      onChange={(e) => setMatPerUnit(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">
                      Labour Cost per Unit (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={labPerUnit}
                      onChange={(e) => setLabPerUnit(e.target.value)}
                      placeholder="e.g. 667"
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                      required
                    />
                  </div>
                </div>

                {/* Auto-populated totals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">
                      Total Materials (₦ × {respondQty} units)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={calcMaterials > 0 ? calcMaterials.toLocaleString('en-NG') : ''}
                      placeholder="Auto-calculated"
                      className="w-full rounded-xl border border-[#E8DED5] bg-atmosphere/60 px-3 py-2.5 text-sm text-[#5A4A44] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">
                      Total Labour (₦ × {respondQty} units)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={calcLabour > 0 ? calcLabour.toLocaleString('en-NG') : ''}
                      placeholder="Auto-calculated"
                      className="w-full rounded-xl border border-[#E8DED5] bg-atmosphere/60 px-3 py-2.5 text-sm text-[#5A4A44] cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Commission — read-only, from admin settings */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Commission (%) <span className="text-xs font-normal text-[#A39289]">— from settings · hidden from brand</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${commPct}%`}
                    className="w-full rounded-xl border border-[#E8DED5] bg-atmosphere/60 px-3 py-2.5 text-sm text-[#5A4A44] cursor-not-allowed"
                  />
                </div>

                {/* Pricing summary */}
                {calcBase > 0 && (
                  <div className="rounded-xl bg-[#FFF8EF] border border-[#E6D7CB] p-4 text-sm space-y-2">
                    <p className="font-semibold text-ink mb-1">Pricing Summary <span className="text-xs font-normal text-[#A39289]">(commission baked in equally)</span></p>
                    <div className="flex justify-between text-[#5A4A44]">
                      <span>Materials (incl. {calcCommPct}%)</span>
                      <strong className="text-ink">{formatCurrency(calcMatWithComm)}</strong>
                    </div>
                    <div className="flex justify-between text-[#5A4A44]">
                      <span>Labour (incl. {calcCommPct}%)</span>
                      <strong className="text-ink">{formatCurrency(calcLabWithComm)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-[#E6D7CB] pt-2 mt-1">
                      <span className="font-semibold text-[#5A4A44]">Price Sent to Brand</span>
                      <strong className="text-leather text-base">{formatCurrency(calcFinalPrice)}</strong>
                    </div>
                  </div>
                )}

                {respondError && (
                  <p className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />{respondError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button type="submit" variant="accent" className="flex-1" disabled={actionLoading}>
                    {actionLoading
                      ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" />Sending...</span>
                      : 'Send Quote to Brand'
                    }
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRespondModal({ open: false, quote: null })}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>

        {/* ---------------------------------------------------------------- */}
        {/* APPROVE / REJECT CONFIRMATION MODAL                              */}
        {/* ---------------------------------------------------------------- */}
        <Modal
          title={reviewModal.action === 'APPROVED' ? 'Approve Quote' : 'Reject Quote'}
          open={reviewModal.open}
          onClose={() => setReviewModal({ open: false, quote: null, action: null })}
        >
          {reviewModal.quote && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8DED5] bg-atmosphere p-4 text-sm">
                <p className="font-bold text-ink">{reviewModal.quote.brandName}</p>
                <p className="text-[#5A4A44] mt-0.5">
                  {reviewModal.quote.productType} · {reviewModal.quote.requestType}
                </p>
                {reviewModal.quote.price && (
                  <p className="mt-1 font-semibold text-leather">
                    Quoted: {formatCurrency(reviewModal.quote.price)}
                  </p>
                )}
              </div>

              <p className="text-sm text-[#5A4A44]">
                {reviewModal.action === 'APPROVED'
                  ? 'Approving this quote will mark it as confirmed. The brand will be notified.'
                  : 'Rejecting this quote will close the request. The brand will be notified.'
                }
              </p>

              <div className="flex gap-3">
                <Button
                  variant={reviewModal.action === 'APPROVED' ? 'accent' : 'outline'}
                  className={`flex-1 ${reviewModal.action === 'REJECTED' ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
                  onClick={submitReview}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" />Processing...</span>
                    : reviewModal.action === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'
                  }
                </Button>
                <Button variant="outline" onClick={() => setReviewModal({ open: false, quote: null, action: null })}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ---------------------------------------------------------------- */}
        {/* DETAIL MODAL — full quote info                                   */}
        {/* ---------------------------------------------------------------- */}
        <Modal
          title="Quote Details"
          open={detailModal.open}
          onClose={() => setDetailModal({ open: false, quote: null })}
        >
          {detailModal.quote && (() => {
            const q = detailModal.quote;
            const TIMELINE_LABEL = {
              URGENT_1_2_WEEKS: '1–2 Weeks (Urgent)',
              WEEKS_3_4:        '3–4 Weeks',
              MONTHS_1_2:       '1–2 Months',
              MONTHS_2_3:       '2–3 Months',
              FLEXIBLE:         'Flexible',
            };
            const fileIcon = (file) => {
              if (file.mimeType?.startsWith('image/'))  return <Image  className="h-4 w-4 text-amber-500" />;
              if (file.mimeType?.startsWith('video/'))  return <Film   className="h-4 w-4 text-purple-500" />;
              return <FileText className="h-4 w-4 text-red-400" />;
            };
            return (
              <div className="space-y-5">
                {/* Header row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-lg font-bold text-ink">{q.brandName}</p>
                    <p className="text-xs text-[#A39289]">{q.brandEmail}</p>
                  </div>
                  <div className="flex flex-row flex-wrap sm:flex-col sm:items-end gap-1">
                    <Badge variant={q.type === 'SAMPLE' ? 'warning' : 'info'}>{q.requestType}</Badge>
                    <Badge variant={{ SUBMITTED: 'warning', UNDER_REVIEW: 'info', APPROVED: 'success', REJECTED: 'error' }[q.status] || 'default'}>
                      {{ SUBMITTED: 'Pending Response', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved', REJECTED: 'Rejected' }[q.status] || q.status}
                    </Badge>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-[#E8DED5] bg-atmosphere p-4 text-sm">
                  {q.ref && (
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase text-[#A39289]">Quote ID</p>
                      <p className="mt-0.5 font-mono font-bold text-leather">[{q.ref}]</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase text-[#A39289]">Product Type</p>
                    <p className="mt-0.5 font-semibold text-ink">{q.productType}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-[#A39289]">Quantity</p>
                    <p className="mt-0.5 font-semibold text-ink">{q.quantity ? q.quantity.toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-[#A39289]">Timeline</p>
                    <p className="mt-0.5 font-semibold text-ink">{TIMELINE_LABEL[q.timeline] || q.timeline || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-[#A39289]">Date Submitted</p>
                    <p className="mt-0.5 font-semibold text-ink">{formatDate(q.createdAt)}</p>
                  </div>
                  {q.price && (
                    <>
                      <div>
                        <p className="text-xs uppercase text-[#A39289]">Quoted Price</p>
                        <p className="mt-0.5 font-semibold text-leather">₦{Number(q.price).toLocaleString('en-NG')}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-[#A39289]">Materials / Labour</p>
                        <p className="mt-0.5 font-semibold text-ink">
                          {q.materials ? `₦${Number(q.materials).toLocaleString('en-NG')}` : '—'}
                          {' / '}
                          {q.labour ? `₦${Number(q.labour).toLocaleString('en-NG')}` : '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Notes */}
                {q.notes && (
                  <div className="rounded-xl border border-[#E8DED5] bg-white p-4">
                    <p className="text-xs uppercase text-[#A39289] mb-1">Brand Notes</p>
                    <p className="text-sm text-ink leading-relaxed">{q.notes}</p>
                  </div>
                )}

                {/* Files */}
                {q.files?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-[#A39289] mb-3">
                      Uploaded Files ({q.files.length})
                    </p>

                    {/* Image grid — up to 5, shown as thumbnails */}
                    {q.files.some((f) => f.mimeType?.startsWith('image/')) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                        {q.files
                          .filter((f) => f.mimeType?.startsWith('image/'))
                          .map((file, i) => {
                            const name = (file.url?.split('?')[0] || '').split('/').pop() || `Image ${i + 1}`;
                            return (
                              <a key={i} href={file.url} target="_blank" rel="noreferrer"
                                className="group relative block aspect-square rounded-xl overflow-hidden border border-[#E8DED5] bg-[#FAF7F4] hover:border-gold transition-colors">
                                <img src={file.url} alt={name} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                </div>
                              </a>
                            );
                          })}
                      </div>
                    )}

                    <div className="space-y-3">
                      {q.files.filter((f) => !f.mimeType?.startsWith('image/')).map((file, i) => {
                        const isImage = false;
                        const isVideo = file.mimeType?.startsWith('video/');
                        const isPdf   = file.mimeType === 'application/pdf'
                                     || file.url?.toLowerCase().endsWith('.pdf');
                        const name    = (file.url?.split('?')[0] || '').split('/').pop() || `File ${i + 1}`;

                        return (
                          <div key={i} className="rounded-xl border border-[#E8DED5] bg-white overflow-hidden">
                            {/* Rendered preview */}
                            {isImage && (
                              <img
                                src={file.url}
                                alt={name}
                                className="w-full max-h-64 object-contain bg-[#FAF7F4]"
                              />
                            )}
                            {isVideo && (
                              <video
                                key={file.url}
                                controls
                                preload="metadata"
                                className="w-full max-h-64 bg-black"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.style.removeProperty('display');
                                }}
                              >
                                <source src={file.url} type={file.mimeType || 'video/mp4'} />
                              </video>
                            )}
                            {isVideo && (
                              <div style={{ display: 'none' }} className="flex flex-col items-center justify-center gap-2 bg-black py-8 text-white text-sm">
                                <Film className="h-8 w-8 opacity-60" />
                                <span className="opacity-70">Preview unavailable</span>
                                <a href={file.url} target="_blank" rel="noreferrer"
                                   className="flex items-center gap-1 text-amber-300 hover:underline text-xs">
                                  Open video <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            {isPdf && (
                              <div className="flex flex-col items-center justify-center gap-3 bg-[#FAF7F4] py-10">
                                <FileText className="h-12 w-12 text-red-400 opacity-80" />
                                <p className="text-sm font-medium text-ink">{name}</p>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 rounded-xl bg-leather px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                                >
                                  Open PDF <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}

                            {/* Footer row with filename + open link */}
                            <div className="flex items-center gap-3 px-3 py-2 border-t border-[#F4EFEA]">
                              {isVideo && <Film    className="h-4 w-4 shrink-0 text-purple-500" />}
                              {isPdf   && <FileText className="h-4 w-4 shrink-0 text-red-400" />}
                              {!isVideo && !isPdf && <FileText className="h-4 w-4 shrink-0 text-[#A39289]" />}
                              <span className="flex-1 truncate text-xs font-medium text-ink">{name}</span>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-xs text-[#8B6A39] hover:underline shrink-0"
                              >
                                Open <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 border-t border-[#E8DED5] pt-4">
                  {q.status === 'SUBMITTED' && (
                    <Button variant="primary" onClick={() => { setDetailModal({ open: false, quote: null }); openRespond(q); }}>
                      Send Production Quote
                    </Button>
                  )}
                  {q.status === 'UNDER_REVIEW' && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-700">
                      Quote sent — awaiting brand payment
                    </div>
                  )}
                  {q.status === 'APPROVED' && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                      ✓ Paid — production order created
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setDetailModal({ open: false, quote: null })}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>

      </PageWrapper>
    </AdminRoute>
  );
}
