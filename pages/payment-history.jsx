import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import AdminRoute from '@/components/auth/AdminRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getArtisanPayoutHistory, downloadArtisanReceipt, getFIRSRemittances, getAdminEarnings } from '@/services/paymentsService';
import { RefreshCw, Search, X, FileText, Users, Building2, Landmark, CheckCircle2, Clock, ArrowDownToLine, AlertCircle } from 'lucide-react';

const STAGE_VARIANT = {
  SAMPLE_FLAT_FEE: 'warning',
  MATERIAL:        'info',
  SERVICE:         'success',
  FULL_PAYMENT:    'success',
};

const STAGE_SHORT = {
  SAMPLE_FLAT_FEE: 'Sample (70%)',
  MATERIAL:        'Stage 1',
  SERVICE:         'Stage 2',
  FULL_PAYMENT:    'Full',
};


// Which summary view is active
const SUMMARY_VIEWS = [
  { id: 'artisan', label: 'Artisan Payouts', icon: Users,     color: 'emerald' },
  { id: 'admin',   label: 'Admin Commission', icon: Building2, color: 'amber'  },
  { id: 'vat',     label: 'VAT to FIRS',      icon: Landmark,  color: 'blue'   },
];

export default function PaymentHistoryPage() {
  const [records, setRecords]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all');
  const [search, setSearch]           = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [summaryView, setSummaryView] = useState('artisan');
  const [firsRemittances, setFirsRemittances] = useState([]);
  const [adminEarnings, setAdminEarnings]     = useState({ totalEarned: 0, totalWithdrawn: 0, outstanding: 0, payouts: [] });

  const load = async () => {
    setLoading(true);
    try {
      const [data, remittances, earnings] = await Promise.all([
        getArtisanPayoutHistory(),
        getFIRSRemittances(),
        getAdminEarnings(),
      ]);
      setRecords(data);
      setFirsRemittances(remittances);
      setAdminEarnings(earnings);
    } finally {
      setLoading(false);
    }
  };


  const handleDownloadReceipt = async (paymentId, orderRef) => {
    try {
      const blob = await downloadArtisanReceipt(paymentId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `leddar-${orderRef || paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const sum  = (arr, key) => arr.reduce((s, r) => s + (r[key] ?? 0), 0);
    const byStage = (stage) => records.filter((r) => r.stage === stage);
    const prodRecs = records.filter((r) => r.stage !== 'SAMPLE_FLAT_FEE');

    return {
      // Artisan payouts
      artisanTotal:  sum(records, 'amount'),
      artisanSample: sum(byStage('SAMPLE_FLAT_FEE'), 'amount'),
      artisanStage1: sum(byStage('MATERIAL'), 'amount'),
      artisanStage2: sum(byStage('SERVICE'), 'amount'),
      // Admin commission
      adminTotal:    sum(records, 'adminCommission'),
      adminSample:   sum(byStage('SAMPLE_FLAT_FEE'), 'adminCommission'),
      adminStage1:   sum(byStage('MATERIAL'), 'adminCommission'),
      adminStage2:   sum(byStage('SERVICE'), 'adminCommission'),
      // VAT to FIRS
      vatTotal:      sum(records, 'vatAmount'),
      vatStage1:     sum(byStage('MATERIAL'), 'vatAmount'),  // only Stage 1 carries VAT
    };
  }, [records]);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (activeTab === 'sample'     && r.stage !== 'SAMPLE_FLAT_FEE') return false;
      if (activeTab === 'production' && r.stage === 'SAMPLE_FLAT_FEE') return false;
      if (filterStage && r.stage !== filterStage) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.artisanName?.toLowerCase().includes(q) &&
          !r.brandName?.toLowerCase().includes(q) &&
          !r.orderRef?.toLowerCase().includes(q) &&
          !r.reference?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [records, activeTab, filterStage, search]);

  const tabs = [
    { id: 'all',        label: 'All Payouts',  count: records.length },
    { id: 'sample',     label: 'Sample',       count: records.filter((r) => r.stage === 'SAMPLE_FLAT_FEE').length },
    { id: 'production', label: 'Production',   count: records.filter((r) => r.stage !== 'SAMPLE_FLAT_FEE').length },
  ];

  return (
    <AdminRoute>
      <PageWrapper
        title="Artisan Payment History"
        subtitle="All payments released to artisans across sample and production jobs"
      >
        {/* ── Summary toggle ── */}
        <div className="mb-4 flex items-center gap-2">
          {SUMMARY_VIEWS.map(({ id, label, icon: Icon, color }) => {
            const active = summaryView === id;
            const colorMap = {
              emerald: active ? 'bg-emerald-700 text-white shadow-md' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50',
              amber:   active ? 'bg-amber-600 text-white shadow-md'   : 'border border-amber-200 text-amber-700 hover:bg-amber-50',
              blue:    active ? 'bg-blue-700 text-white shadow-md'    : 'border border-blue-200 text-blue-700 hover:bg-blue-50',
            };
            return (
              <button
                key={id}
                onClick={() => setSummaryView(id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${colorMap[color]}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Summary cards ── */}
        {summaryView === 'artisan' && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-espresso p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Total Artisan Payouts</p>
              <p className="mt-2 text-2xl font-extrabold">{formatCurrency(stats.artisanTotal)}</p>
              <p className="mt-1 text-[11px] text-neutral-500">{records.length} payments</p>
            </div>
            <div className="rounded-2xl border border-[#E8DED5] bg-[#FFF8EA] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6A39]">Sample Payouts</p>
              <p className="mt-2 text-2xl font-extrabold text-leather">{formatCurrency(stats.artisanSample)}</p>
              <p className="mt-1 text-[11px] text-[#A39289]">70% of flat fee</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Stage 1 (Materials)</p>
              <p className="mt-2 text-2xl font-extrabold text-blue-800">{formatCurrency(stats.artisanStage1)}</p>
              <p className="mt-1 text-[11px] text-blue-400">Raw materials payment</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Stage 2 (Service)</p>
              <p className="mt-2 text-2xl font-extrabold text-emerald-800">{formatCurrency(stats.artisanStage2)}</p>
              <p className="mt-1 text-[11px] text-emerald-400">Service fee payment</p>
            </div>
          </div>
        )}

        {summaryView === 'admin' && (
          <div className="mb-6 space-y-4">
            {/* ── Earnings summary cards ── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-amber-800 p-5 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Total Earned</p>
                <p className="mt-2 text-2xl font-extrabold">{formatCurrency(adminEarnings.totalEarned)}</p>
                <p className="mt-1 text-[11px] text-amber-300">All released commissions</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Withdrawn</p>
                <p className="mt-2 text-2xl font-extrabold text-emerald-800">{formatCurrency(adminEarnings.totalWithdrawn)}</p>
                <p className="mt-1 text-[11px] text-emerald-400">{adminEarnings.payoutCount} payout{adminEarnings.payoutCount !== 1 ? 's' : ''}</p>
              </div>
              <div className={`rounded-2xl border p-5 shadow-sm ${adminEarnings.outstanding > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${adminEarnings.outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>Available to Withdraw</p>
                <p className={`mt-2 text-2xl font-extrabold ${adminEarnings.outstanding > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>{formatCurrency(adminEarnings.outstanding)}</p>
                <p className={`mt-1 text-[11px] ${adminEarnings.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {adminEarnings.outstanding > 0 ? 'Ready to withdraw' : 'All withdrawn ✓'}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Breakdown</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-amber-700">
                  <p>Sample: <strong>{formatCurrency(stats.adminSample)}</strong></p>
                  <p>Stage 1: <strong>{formatCurrency(stats.adminStage1)}</strong></p>
                  <p>Stage 2: <strong>{formatCurrency(stats.adminStage2)}</strong></p>
                </div>
                <p className="mt-2 text-[10px] text-amber-500 italic">Go to Payments → Admin Commission to withdraw.</p>
              </div>
            </div>

            {/* ── Payout history log ── */}
            <div className="overflow-hidden rounded-2xl border border-[#E8DED5] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#F4EFEA] px-5 py-3">
                <ArrowDownToLine className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">Withdrawal History</p>
              </div>
              {(!adminEarnings.payouts || adminEarnings.payouts.length === 0) ? (
                <p className="px-5 py-8 text-center text-sm text-[#A39289]">No withdrawals yet. Use the "Withdraw" button to move your commission to your bank.</p>
              ) : (
                <div className="divide-y divide-[#F4EFEA]">
                  {adminEarnings.payouts.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        p.status === 'SUCCESS'  ? 'bg-emerald-100' :
                        p.status === 'FAILED'   ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                        {p.status === 'SUCCESS'  && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {p.status === 'FAILED'   && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {p.status === 'INITIATED'&& <Clock className="h-4 w-4 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-ink">{formatCurrency(p.amount)}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === 'SUCCESS'   ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'FAILED'    ? 'bg-red-100 text-red-600' :
                            'bg-amber-100 text-amber-700'
                          }`}>{p.status}</span>
                        </div>
                        <p className="text-xs text-[#A39289] truncate">
                          {p.bankName} · {p.accountNumber}
                          {p.note && ` · ${p.note}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#A39289] shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDate(p.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {summaryView === 'vat' && (() => {
          const totalRemitted = firsRemittances.reduce((s, r) => s + r.amount, 0);
          const outstanding   = Math.max(0, stats.vatTotal - totalRemitted);
          return (
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-blue-900 p-5 text-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Total VAT Collected</p>
                  <p className="mt-2 text-2xl font-extrabold">{formatCurrency(stats.vatTotal)}</p>
                  <p className="mt-1 text-[11px] text-blue-300">From artisan payments</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Remitted to FIRS</p>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-800">{formatCurrency(totalRemitted)}</p>
                  <p className="mt-1 text-[11px] text-emerald-400">{firsRemittances.length} remittance{firsRemittances.length !== 1 ? 's' : ''}</p>
                </div>
                <div className={`rounded-2xl border p-5 shadow-sm ${outstanding > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>Outstanding</p>
                  <p className={`mt-2 text-2xl font-extrabold ${outstanding > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>{formatCurrency(outstanding)}</p>
                  <p className={`mt-1 text-[11px] ${outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {outstanding > 0 ? 'Yet to be remitted' : 'Fully remitted ✓'}
                  </p>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Stage 1 VAT</p>
                  <p className="mt-2 text-2xl font-extrabold text-blue-800">{formatCurrency(stats.vatStage1)}</p>
                  <p className="mt-1 text-[11px] text-blue-400">7.5% × prod balance</p>
                </div>
              </div>

              {/* Remittance log */}
              <div className="overflow-hidden rounded-2xl border border-[#E8DED5] bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#F4EFEA] px-5 py-3">
                  <Landmark className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-[#A39289]">FIRS Remittance Log</p>
                  <span className="ml-auto text-xs text-[#A39289]">{firsRemittances.length} record{firsRemittances.length !== 1 ? 's' : ''}</span>
                </div>
                {firsRemittances.length === 0 ? (
                  <p className="px-5 py-6 text-center text-sm text-[#A39289]">No remittances recorded yet. Use the Payments → VAT (FIRS) tab to log them.</p>
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
            </div>
          );
        })()}

        {/* ── Tabs + controls ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-2 rounded-2xl border border-[#E8DED5] bg-white p-1.5 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFilterStage(''); }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-leather text-white shadow-md'
                    : 'text-[#6A5B54] hover:bg-atmosphere'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#F4EFEA] text-[#A39289]'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#E8DED5] bg-white px-3 py-2 text-sm font-medium text-[#6A5B54] hover:bg-atmosphere"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="mb-4 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A39289]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artisan, brand, order ref…"
              className="w-full rounded-xl border border-[#E8DED5] pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
            />
          </div>

          {/* Stage filter — hidden on sample tab since it only has one stage */}
          {activeTab !== 'sample' && (
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="rounded-xl border border-[#E8DED5] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
            >
              <option value="">All Stages</option>
              {activeTab !== 'production' && <option value="SAMPLE_FLAT_FEE">Sample (70%)</option>}
              <option value="MATERIAL">Stage 1 — Materials</option>
              <option value="SERVICE">Stage 2 — Service Fee</option>
            </select>
          )}

          {/* Clear */}
          {(search || filterStage) && (
            <button
              onClick={() => { setSearch(''); setFilterStage(''); }}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8DED5] bg-white px-3 py-2 text-xs font-semibold text-[#A39289] hover:bg-atmosphere"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-[#E8DED5] bg-white p-16 text-center text-[#A39289]">
            {records.length === 0
              ? 'No artisan payments have been released yet.'
              : 'No payments match the current filters.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                    {['Order', 'Brand', 'Product', 'Artisan', 'Stage', 'Flat Fee', 'Artisan Payout', 'Admin Commission', 'VAT', 'Status', 'Date', 'Invoice'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-atmosphere/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-mono text-xs font-bold text-leather">{r.orderRef}</p>
                        {r.quoteRef && (
                          <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{r.quoteRef}]</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#5A4A44]">{r.brandName}</td>
                      <td className="px-4 py-3 text-[#5A4A44]">{r.productType || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{r.artisanName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          r.stage === 'SAMPLE_FLAT_FEE' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : r.stage === 'MATERIAL'      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : r.stage === 'SERVICE'       ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-[#F4EFEA] text-[#6A5B54] border border-[#E8DED5]'
                        }`}>
                          {STAGE_SHORT[r.stage] || r.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5A4A44] whitespace-nowrap">
                        {r.flatFee != null ? formatCurrency(r.flatFee) : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">
                        {formatCurrency(r.amount)}
                        {r.stage === 'SAMPLE_FLAT_FEE' && <span className="ml-1 text-[10px] text-emerald-500">✓</span>}
                      </td>
                      <td className="px-4 py-3 text-[#5A4A44] whitespace-nowrap">
                        {r.adminCommission != null ? formatCurrency(r.adminCommission) : '—'}
                      </td>
                      <td className="px-4 py-3 text-blue-700 font-semibold whitespace-nowrap">
                        {r.vatAmount != null ? formatCurrency(r.vatAmount) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                          ✓ {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A39289] whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {['SAMPLE_FLAT_FEE', 'MATERIAL', 'SERVICE'].includes(r.stage) ? (
                          <button
                            onClick={() => handleDownloadReceipt(r.id, r.orderRef)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                          >
                            <FileText className="h-3.5 w-3.5" /> Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-[#A39289]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="border-t border-[#F4EFEA] px-4 py-2 flex items-center justify-between text-xs text-[#A39289]">
                <span>Showing {filtered.length} of {records.length} payments</span>
                <span className="font-semibold text-ink">
                  {summaryView === 'artisan' && <>Total artisan payouts: {formatCurrency(filtered.reduce((s, r) => s + r.amount, 0))}</>}
                  {summaryView === 'admin'   && <>Total admin commission: {formatCurrency(filtered.reduce((s, r) => s + (r.adminCommission ?? 0), 0))}</>}
                  {summaryView === 'vat'     && <>Total VAT to FIRS: {formatCurrency(filtered.reduce((s, r) => s + (r.vatAmount ?? 0), 0))}</>}
                </span>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </AdminRoute>
  );
}
