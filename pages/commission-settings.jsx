import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import AdminRoute from '@/components/auth/AdminRoute';
import Modal from '@/components/ui/Modal';
import {
  getCommissionSettings, updateCommissionSettings,
  getSamplePricingSettings, updateSamplePricingSettings,
  VAT_RATE,
} from '@/services/commissionService';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils';
import { Save, RefreshCw, FlaskConical, Package, Info, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

const fmt = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
const pct = (n) => `${n}%`;

// ── Visual split bar ──────────────────────────────────────────────────────────
function SplitBar({ segments }) {
  // segments: [{ label, pct, color }]
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium text-[#6A5B54]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} <span className="font-bold text-ink">{s.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E8DED5] bg-white px-5 py-4 shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
      <span className="mt-1 text-2xl font-extrabold text-ink">{value}</span>
    </div>
  );
}

// ── Number input ──────────────────────────────────────────────────────────────
function PctInput({ label, name, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          name={name}
          value={value}
          min={0}
          max={100}
          onChange={onChange}
          className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3 pr-10 text-sm font-bold text-ink outline-none focus:border-leather focus:ring-2 focus:ring-leather/10 transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#A39289]">%</span>
      </div>
      {hint && <p className="mt-1 text-[11px] text-[#A39289]">{hint}</p>}
    </div>
  );
}

// ── Hours input ──────────────────────────────────────────────────────────────
function HrsInput({ label, name, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          name={name}
          value={value}
          min={1}
          max={168}
          onChange={onChange}
          className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3 pr-14 text-sm font-bold text-ink outline-none focus:border-leather focus:ring-2 focus:ring-leather/10 transition"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#A39289]">hrs</span>
      </div>
      {hint && <p className="mt-1 text-[11px] text-[#A39289]">{hint}</p>}
    </div>
  );
}

// ── Formula card ──────────────────────────────────────────────────────────────
function FormulaCard({ formula, example }) {
  return (
    <div className="rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1">Formula</p>
      <p className="text-sm font-mono font-semibold text-leather">{formula}</p>
      {example && <p className="mt-1 text-[11px] text-[#A39289]">{example}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CommissionSettingsPage() {
  const [saved, setSaved]             = useState(null);  // last saved settings
  const [form, setForm]               = useState(null);
  const [saving, setSaving]           = useState(false);

  const [pricing, setPricing]         = useState([]);
  const [pricingDraft, setPricingDraft] = useState([]);
  const [savingPricing, setSavingPricing] = useState(false);

  // action: 'commission' | 'pricing' — which save flow the OTP confirms
  const [otpModal, setOtpModal] = useState({ open: false, otp: '', error: '', action: null });
  const [pendingPricingPayload, setPendingPricingPayload] = useState(null);

  // Preview amounts
  const [previewSample, setPreviewSample]   = useState(30000);
  const [previewProd, setPreviewProd]       = useState(500000);

  useEffect(() => {
    async function load() {
      const [data, rows] = await Promise.all([
        getCommissionSettings(),
        getSamplePricingSettings(),
      ]);
      setSaved(data);
      setForm({ ...data });
      setPricing(rows);
      setPricingDraft(rows.map((r) => ({ ...r })));
    }
    load();
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const prodTotal = useMemo(() => {
    if (!form) return 0;
    return Number(form.adminRate || 0) + Number(form.artisanStage1Rate || 0) + Number(form.artisanStage2Rate || 0);
  }, [form]);

  const sampleArtisanRate = useMemo(() => {
    if (!form) return 0;
    return Math.max(0, 100 - Number(form.sampleAdminRate || 0));
  }, [form]);

  const prodValid   = prodTotal === 100;
  const sampleValid = Number(form?.sampleAdminRate || 0) <= 100;

  const formIsDirty = useMemo(() => {
    if (!form || !saved) return false;
    return (
      Number(form.adminRate)                 !== Number(saved.adminRate) ||
      Number(form.artisanStage1Rate)          !== Number(saved.artisanStage1Rate) ||
      Number(form.artisanStage2Rate)          !== Number(saved.artisanStage2Rate) ||
      Number(form.sampleAdminRate)            !== Number(saved.sampleAdminRate) ||
      Number(form.sampleAcceptanceHours)      !== Number(saved.sampleAcceptanceHours) ||
      Number(form.productionAcceptanceHours)  !== Number(saved.productionAcceptanceHours)
    );
  }, [form, saved]);

  const canSave = prodValid && sampleValid && formIsDirty;

  const pricingIsDirty = useMemo(() => {
    const savedMap = Object.fromEntries(pricing.map((r) => [r.productType, Number(r.price)]));
    return pricingDraft.some((r) => Number(r.price) !== savedMap[r.productType]);
  }, [pricing, pricingDraft]);

  // Live preview
  const sampleBrandPays   = Math.round(previewSample * (1 + VAT_RATE));
  const sampleAdminGets   = form ? Math.round(previewSample * (form.sampleAdminRate / 100)) : 0;
  const sampleArtisanGets = Math.round(previewSample * (sampleArtisanRate / 100));

  const prodBase        = Math.max(0, previewProd - previewSample);
  const prodBrandPays   = Math.round(prodBase * (1 + VAT_RATE));
  const prodAdminGets   = form ? Math.round(prodBase * (form.adminRate / 100)) : 0;
  const prodStage1Gets  = form ? Math.round(prodBase * (form.artisanStage1Rate / 100)) : 0;
  const prodStage2Gets  = form ? Math.round(prodBase * (form.artisanStage2Rate / 100)) : 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const result = await updateCommissionSettings(form);
      if (result.requiresOtp) {
        setOtpModal({ open: true, otp: '', error: '', action: 'commission' });
        toast(result.message || 'OTP sent to your admin email.');
      } else {
        setSaved(result.data);
        setForm({ ...result.data });
        toast.success(result.message || 'Commission settings saved');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleOtpConfirm = async () => {
    if (!otpModal.otp.trim()) {
      setOtpModal((p) => ({ ...p, error: 'Enter the OTP from your admin email.' }));
      return;
    }
    setSaving(true);
    setOtpModal((p) => ({ ...p, error: '' }));
    try {
      if (otpModal.action === 'pricing') {
        const result = await updateSamplePricingSettings(pendingPricingPayload, otpModal.otp.trim());
        if (result.requiresOtp) {
          setOtpModal((p) => ({ ...p, error: 'Still awaiting confirmation — request a new OTP and try again.' }));
          return;
        }
        setPricing(pendingPricingPayload);
        setPendingPricingPayload(null);
        setOtpModal({ open: false, otp: '', error: '', action: null });
        toast.success(result.message || 'Sample prices updated');
      } else {
        const result = await updateCommissionSettings(form, otpModal.otp.trim());
        if (result.requiresOtp) {
          setOtpModal((p) => ({ ...p, error: 'Still awaiting confirmation — request a new OTP and try again.' }));
          return;
        }
        setSaved(result.data);
        setForm({ ...result.data });
        setOtpModal({ open: false, otp: '', error: '', action: null });
        toast.success(result.message || 'Commission settings saved');
      }
    } catch (err) {
      setOtpModal((p) => ({ ...p, error: getErrorMessage(err, 'Incorrect OTP.') }));
    } finally {
      setSaving(false);
    }
  };

  const onPriceChange = (productType, value) => {
    setPricingDraft((prev) =>
      prev.map((r) => r.productType === productType ? { ...r, price: value } : r)
    );
  };

  const onSavePricing = async () => {
    const payload = pricingDraft.map(({ productType, price }) => ({ productType, price: Number(price) }));
    setSavingPricing(true);
    try {
      const result = await updateSamplePricingSettings(payload);
      if (result.requiresOtp) {
        setPendingPricingPayload(payload);
        setOtpModal({ open: true, otp: '', error: '', action: 'pricing' });
        toast(result.message || 'OTP sent to your admin email.');
      } else {
        setPricing(payload);
        toast.success(result.message || 'Sample prices updated');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save pricing'));
    } finally {
      setSavingPricing(false);
    }
  };

  if (!form || !saved) {
    return (
      <AdminRoute>
        <PageWrapper title="Commission Settings">
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-leather" />
          </div>
        </PageWrapper>
      </AdminRoute>
    );
  }

  const VAT_PCT = VAT_RATE * 100; // 7.5

  return (
    <AdminRoute>
      <PageWrapper
        title="Commission Settings"
        subtitle="Configure how revenue is split between admin, artisans, and VAT"
      >

        {/* ── VAT notice banner ───────────────────────────────────────────── */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div className="text-sm text-blue-800">
            <strong>VAT is fixed at {VAT_PCT}%</strong> and is always added on top of the base price before
            the brand is charged. It is not configurable here.
            <span className="ml-2 font-mono text-[11px] text-blue-600">
              Brand pays = Base × 107.5%
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">

          {/* ══ SAMPLE ORDER SECTION ══════════════════════════════════════════ */}
          <section className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#F4EFEA] bg-[#FFF8EA] px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <FlaskConical className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Sample Order</h2>
                <p className="text-xs text-[#A39289]">One-time sample fee per product type, set below</p>
              </div>
              <div className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                Total collected = 107.5%
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current split bar */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-3">Current Split (of sample base price)</p>
                <SplitBar segments={[
                  { label: 'Admin',   pct: saved.sampleAdminRate,             color: '#C49A3C' },
                  { label: 'Artisan', pct: 100 - saved.sampleAdminRate,       color: '#5BA45D' },
                  { label: 'VAT',     pct: VAT_PCT,                           color: '#93C5FD' },
                ]} />
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-3 gap-3">
                <StatPill label="Admin"   value={pct(saved.sampleAdminRate)}           color="#C49A3C" />
                <StatPill label="Artisan" value={pct(100 - saved.sampleAdminRate)}     color="#5BA45D" />
                <StatPill label="VAT"     value={pct(VAT_PCT)}                         color="#93C5FD" />
              </div>

              {/* Formula */}
              <FormulaCard
                formula={`Brand pays = Sample Price × 107.5%`}
                example={`Artisan receives = Sample Price × ${100 - saved.sampleAdminRate}%  ·  Admin retains = Sample Price × ${saved.sampleAdminRate}%`}
              />

              {/* Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <PctInput
                  label="Admin Commission"
                  name="sampleAdminRate"
                  value={form.sampleAdminRate}
                  onChange={onChange}
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1.5">
                    Artisan Payout <span className="text-[10px] font-normal">(auto)</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-[#E8DED5] bg-atmosphere px-4 py-3">
                    <span className="text-sm font-bold text-emerald-700">{sampleArtisanRate}%</span>
                    <span className="ml-2 text-[11px] text-[#A39289]">= 100% − Admin</span>
                  </div>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Live Preview</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#A39289]">Sample price:</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A39289]">₦</span>
                      <input
                        type="number"
                        value={previewSample}
                        onChange={(e) => setPreviewSample(Number(e.target.value))}
                        className="w-28 rounded-lg border border-amber-200 bg-white pl-6 pr-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Brand pays',        value: fmt(sampleBrandPays),   color: 'text-ink' },
                    { label: 'Admin gets',         value: fmt(sampleAdminGets),   color: 'text-amber-700' },
                    { label: 'Artisan gets',       value: fmt(sampleArtisanGets), color: 'text-emerald-700' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-white border border-amber-100 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A39289]">{item.label}</p>
                      <p className={`mt-0.5 text-sm font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══ PRODUCTION ORDER SECTION ══════════════════════════════════════ */}
          <section className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#F4EFEA] bg-[#EAF3DE] px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Production Order</h2>
                <p className="text-xs text-[#A39289]">Applied to the balance after deducting the sample price</p>
              </div>
              <div className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
                prodValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {prodValid ? '✓ Rates sum to 100%' : `${prodTotal}% — must equal 100%`}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current split bar */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-3">Current Split (of production balance)</p>
                <SplitBar segments={[
                  { label: 'Admin',    pct: saved.adminRate,         color: '#C49A3C' },
                  { label: 'Stage 1',  pct: saved.artisanStage1Rate, color: '#5BA45D' },
                  { label: 'Stage 2',  pct: saved.artisanStage2Rate, color: '#2D8B72' },
                  { label: 'VAT',      pct: VAT_PCT,                 color: '#93C5FD' },
                ]} />
              </div>

              {/* Stat pills */}
              <div className="grid grid-cols-4 gap-3">
                <StatPill label="Admin"    value={pct(saved.adminRate)}         color="#C49A3C" />
                <StatPill label="Stage 1"  value={pct(saved.artisanStage1Rate)} color="#5BA45D" />
                <StatPill label="Stage 2"  value={pct(saved.artisanStage2Rate)} color="#2D8B72" />
                <StatPill label="VAT"      value={pct(VAT_PCT)}                 color="#93C5FD" />
              </div>

              {/* Formula */}
              <FormulaCard
                formula={`Brand pays = (Production Total − Sample Price) × 107.5%`}
                example={`Admin = Balance × ${saved.adminRate}%  ·  Stage 1 = Balance × ${saved.artisanStage1Rate}%  ·  Stage 2 = Balance × ${saved.artisanStage2Rate}%`}
              />

              {/* Inputs */}
              <div className="grid gap-4 sm:grid-cols-3">
                <PctInput
                  label="Admin Commission"
                  name="adminRate"
                  value={form.adminRate}
                  onChange={onChange}
                  hint="Leddar platform fee"
                />
                <PctInput
                  label="Artisan Stage 1"
                  name="artisanStage1Rate"
                  value={form.artisanStage1Rate}
                  onChange={onChange}
                  hint="Raw materials payment"
                />
                <PctInput
                  label="Artisan Stage 2"
                  name="artisanStage2Rate"
                  value={form.artisanStage2Rate}
                  onChange={onChange}
                  hint="Service fee payment"
                />
              </div>

              {/* Running total indicator */}
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                prodValid
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {prodValid
                  ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                  : <AlertCircle className="h-4 w-4 shrink-0" />
                }
                Production rates total: <strong className="ml-1">{prodTotal}%</strong>
                {!prodValid && <span className="ml-1 font-normal">— must equal exactly 100%</span>}
              </div>

              {/* Live preview */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Live Preview</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A39289]">Prod. total:</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A39289]">₦</span>
                        <input
                          type="number"
                          value={previewProd}
                          onChange={(e) => setPreviewProd(Number(e.target.value))}
                          className="w-28 rounded-lg border border-emerald-200 bg-white pl-6 pr-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#A39289]">Sample price:</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A39289]">₦</span>
                        <input
                          type="number"
                          value={previewSample}
                          onChange={(e) => setPreviewSample(Number(e.target.value))}
                          className="w-28 rounded-lg border border-emerald-200 bg-white pl-6 pr-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-2 text-[11px] text-[#A39289]">
                  Balance = {fmt(previewProd)} − {fmt(previewSample)} = <strong className="text-ink">{fmt(prodBase)}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Brand pays',  value: fmt(prodBrandPays),  color: 'text-ink' },
                    { label: 'Admin gets',  value: fmt(prodAdminGets),  color: 'text-amber-700' },
                    { label: 'Stage 1',     value: fmt(prodStage1Gets), color: 'text-emerald-700' },
                    { label: 'Stage 2',     value: fmt(prodStage2Gets), color: 'text-teal-700' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-white border border-emerald-100 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#A39289]">{item.label}</p>
                      <p className={`mt-0.5 text-sm font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══ JOB ACCEPTANCE WINDOWS ══════════════════════════════════════ */}
          <section className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#F4EFEA] bg-[#F0F4FF] px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Job Acceptance Windows</h2>
                <p className="text-xs text-[#A39289]">How long an artisan has to accept or decline a job before it auto-expires</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <HrsInput
                  label="Sample Job Window"
                  name="sampleAcceptanceHours"
                  value={form.sampleAcceptanceHours ?? 24}
                  onChange={onChange}
                  hint="Hours before a sample job expires if artisan doesn't respond (default: 24 hrs)"
                />
                <HrsInput
                  label="Production Job Window"
                  name="productionAcceptanceHours"
                  value={form.productionAcceptanceHours ?? 48}
                  onChange={onChange}
                  hint="Hours before a production job expires if artisan doesn't respond (default: 48 hrs)"
                />
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <p className="text-xs text-indigo-800">
                  When a job expires, it is marked <strong>Expired</strong>, the order is rolled back for reassignment,
                  and you are notified via WhatsApp, email, and in-app.
                </p>
              </div>
            </div>
          </section>

          {/* ── Save button ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8DED5] bg-white px-6 py-4 shadow-sm">
            <p className="text-xs text-[#A39289] max-w-sm">
              Changes apply to <strong>future orders only</strong>. Existing orders retain the commission rate that was active when they were created.
            </p>
            <button
              type="submit"
              disabled={!canSave || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-leather px-6 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
                : <><Save className="h-4 w-4" /> Save Commission Settings</>
              }
            </button>
          </div>

        </form>

        {/* ══ SAMPLE PRICING TABLE ══════════════════════════════════════════ */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#F4EFEA] bg-[#FFF8EA] px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
              <FlaskConical className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">Sample Flat Fees by Product</h2>
              <p className="text-xs text-[#A39289]">
                Base price per product type — brand is charged this × 107.5% (incl. VAT)
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {pricingDraft.map((row) => {
                const brandPays = Math.round(row.price * (1 + VAT_RATE));
                return (
                  <div
                    key={row.productType}
                    className="flex items-center gap-4 rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink">{row.productType}</p>
                      <p className="text-[11px] text-[#A39289] mt-0.5">
                        Brand pays: <strong className="text-leather">{fmt(brandPays)}</strong> (incl. 7.5% VAT)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-sm font-semibold text-[#A39289]">₦</span>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={row.price}
                        onChange={(e) => onPriceChange(row.productType, e.target.value)}
                        className="w-28 rounded-xl border border-[#E8DED5] bg-white px-3 py-2 text-sm font-bold text-right text-ink outline-none focus:border-leather focus:ring-2 focus:ring-leather/10 transition"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {pricingDraft.length === 0 && (
              <p className="py-8 text-center text-sm text-[#A39289]">No product types configured yet.</p>
            )}

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-xs text-[#A39289]">Changes apply immediately to new sample requests.</p>
              <button
                onClick={onSavePricing}
                disabled={savingPricing || !pricingIsDirty}
                className="inline-flex items-center gap-2 rounded-xl bg-leather px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {savingPricing
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><Save className="h-4 w-4" /> Save Prices</>
                }
              </button>
            </div>
          </div>
        </section>

        {/* ── OTP confirmation modal ─────────────────────────────────────── */}
        <Modal
          title={otpModal.action === 'pricing' ? 'Confirm Sample Pricing Change' : 'Confirm Commission Settings Change'}
          open={otpModal.open}
          onClose={() => { setOtpModal({ open: false, otp: '', error: '', action: null }); setPendingPricingPayload(null); }}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                Check your admin email for a 6-digit code and enter it below to confirm this change.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#A39289] mb-1.5">One-Time Password (OTP)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={otpModal.otp}
                onChange={(e) => setOtpModal((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '') }))}
                placeholder="e.g. 123456"
                className="w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3.5 text-center text-2xl font-extrabold tracking-[0.5em] text-ink outline-none focus:border-leather focus:ring-2 focus:ring-leather/10 transition"
              />
            </div>

            {otpModal.error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" /> {otpModal.error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleOtpConfirm}
                disabled={saving || otpModal.otp.length < 4}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-leather py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Confirm OTP</>
                }
              </button>
              <button
                onClick={() => { setOtpModal({ open: false, otp: '', error: '', action: null }); setPendingPricingPayload(null); }}
                className="flex-1 rounded-xl border border-[#E8DED5] bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-atmosphere transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>

      </PageWrapper>
    </AdminRoute>
  );
}
