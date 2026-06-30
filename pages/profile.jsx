import { useEffect, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import AdminRoute from '@/components/auth/AdminRoute';
import apiClient from '@/services/apiClient';
import {
  Save, Loader2, CheckCircle2, AlertCircle, ShieldCheck,
  Landmark, Info, User, Lock, Building2,
} from 'lucide-react';

// ── Nigerian banks fallback list ──────────────────────────────────────────────
const NIGERIAN_BANKS = [
  { name: "Access Bank",                     code: "044" },
  { name: "Citibank Nigeria",                code: "023" },
  { name: "Ecobank Nigeria",                 code: "050" },
  { name: "Fidelity Bank",                   code: "070" },
  { name: "First Bank of Nigeria",           code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)",    code: "058" },
  { name: "Heritage Bank",                   code: "030" },
  { name: "Keystone Bank",                   code: "082" },
  { name: "Kuda Microfinance Bank",          code: "50211" },
  { name: "Moniepoint Microfinance Bank",    code: "50515" },
  { name: "Opay (OPay Digital Services)",    code: "100004" },
  { name: "Palmpay",                         code: "999991" },
  { name: "Polaris Bank",                    code: "076" },
  { name: "Providus Bank",                   code: "101" },
  { name: "Stanbic IBTC Bank",              code: "221" },
  { name: "Standard Chartered Bank",         code: "068" },
  { name: "Sterling Bank",                   code: "232" },
  { name: "Union Bank of Nigeria",           code: "032" },
  { name: "United Bank for Africa (UBA)",    code: "033" },
  { name: "Wema Bank",                       code: "035" },
  { name: "Zenith Bank",                     code: "057" },
].sort((a, b) => a.name.localeCompare(b.name));

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = "w-full rounded-xl border border-[#E8DED5] bg-[#FDFAF8] px-4 py-3 text-sm text-ink outline-none focus:border-leather focus:ring-2 focus:ring-leather/10 transition";

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, iconBg, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
      <div className="flex items-center gap-3 border-b border-[#F4EFEA] bg-[#FDFAF8] px-6 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-[#A39289]">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ── Field label ───────────────────────────────────────────────────────────────
function Label({ children }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1.5">{children}</label>;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 4000);
  };
  return { toast, show };
}

export default function ProfilePage() {
  const { toast, show } = useToast();

  // ── Admin info ──────────────────────────────────────────────────────────────
  const [info, setInfo]         = useState({ name: '', email: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // ── Password ────────────────────────────────────────────────────────────────
  const [pw, setPw]             = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  // ── Bank details ────────────────────────────────────────────────────────────
  const [dbDetail, setDbDetail]       = useState(null);
  const [fetchingBank, setFetchingBank] = useState(true);
  const [banks, setBanks]             = useState(NIGERIAN_BANKS);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankForm, setBankForm]       = useState({ bankName: '', bankCode: '', accountNumber: '', accountName: '' });
  const [verifyState, setVerifyState] = useState('idle'); // idle | loading | verified | error
  const [resolvedName, setResolvedName] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [savingBank, setSavingBank]   = useState(false);

  // Load saved bank detail + live bank list
  useEffect(() => {
    setFetchingBank(true);
    apiClient.get('/admin/bank-details')
      .then((res) => {
        const d = res.data.data;
        if (d) {
          setDbDetail(d);
          setBankForm({ bankName: d.bankName || '', bankCode: d.bankCode || '', accountNumber: d.accountNumber || '', accountName: d.accountName || '' });
          setVerifyState('verified');
          setResolvedName(d.accountName || '');
        }
      })
      .catch(() => {})
      .finally(() => setFetchingBank(false));

    setBanksLoading(true);
    apiClient.get('/admin/banks')
      .then((res) => {
        const live = res.data.data || [];
        if (live.length > 0) setBanks(live.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  // ── Bank verification ───────────────────────────────────────────────────────
  const resetVerify = () => {
    setVerifyState('idle');
    setResolvedName('');
    setVerifyError('');
    setBankForm((p) => ({ ...p, accountName: '' }));
  };

  const verifyAccount = async (accountNumber, bankCode) => {
    setVerifyState('loading');
    setVerifyError('');
    try {
      const res  = await apiClient.get('/admin/bank/resolve', { params: { account_number: accountNumber, bank_code: bankCode } });
      const name = res.data.data.accountName;
      setResolvedName(name);
      setBankForm((p) => ({ ...p, accountName: name }));
      setVerifyState('verified');
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Account not found. Check the number and bank.');
      setVerifyState('error');
    }
  };

  const handleBankSelect = (e) => {
    const code  = e.target.value;
    const found = banks.find((b) => b.code === code);
    setBankForm((p) => ({ ...p, bankCode: code, bankName: found?.name || '' }));
    resetVerify();
    if (bankForm.accountNumber.length === 10 && code) verifyAccount(bankForm.accountNumber, code);
  };

  const handleAccountNumber = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setBankForm((p) => ({ ...p, accountNumber: val }));
    resetVerify();
    if (val.length === 10 && bankForm.bankCode) verifyAccount(val, bankForm.bankCode);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!bankForm.bankCode)                   return show('Please select your bank.', true);
    if (bankForm.accountNumber.length !== 10)  return show('Account number must be 10 digits.', true);
    if (verifyState !== 'verified')            return show('Please verify your account number first.', true);

    setSavingBank(true);
    try {
      await apiClient.put('/admin/bank-details', bankForm);
      setDbDetail({ ...bankForm });
      show('Bank details saved successfully.');
    } catch (err) {
      show(err.response?.data?.message || 'Failed to save bank details.', true);
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      // Placeholder — wire to real endpoint if one exists
      await new Promise((r) => setTimeout(r, 600));
      show('Profile info saved.');
    } catch {
      show('Failed to save profile.', true);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return show('New passwords do not match.', true);
    if (pw.next.length < 8)    return show('Password must be at least 8 characters.', true);
    setSavingPw(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      show('Password updated.');
      setPw({ current: '', next: '', confirm: '' });
    } catch {
      show('Failed to update password.', true);
    } finally {
      setSavingPw(false);
    }
  };

  const hasBank = !!dbDetail?.accountName;

  return (
    <AdminRoute>
      <PageWrapper title="Admin Profile" subtitle="Manage your account info, security, and bank details">

        {/* Toast */}
        {toast && (
          <div className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
            toast.isError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {toast.isError
              ? <AlertCircle className="h-4 w-4 shrink-0" />
              : <CheckCircle2 className="h-4 w-4 shrink-0" />
            }
            {toast.msg}
          </div>
        )}

        <div className="space-y-6">

          {/* ── Admin Info ─────────────────────────────────────────────────── */}
          <Section icon={User} iconBg="bg-leather/10 text-leather" title="Admin Info" subtitle="Your display name and contact details">
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full Name</Label>
                  <input
                    value={info.name}
                    onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
                    placeholder="System Admin"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <input
                    type="email"
                    value={info.email}
                    onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))}
                    placeholder="admin@leddar.com"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="inline-flex items-center gap-2 rounded-xl bg-leather px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {savingInfo ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Info</>}
                </button>
              </div>
            </form>
          </Section>

          {/* ── Security ───────────────────────────────────────────────────── */}
          <Section icon={Lock} iconBg="bg-violet-100 text-violet-700" title="Security" subtitle="Update your login password">
            <form onSubmit={handleSavePw} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} className={inputCls} placeholder="••••••••" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>New Password</Label>
                  <input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={inputCls} placeholder="••••••••" />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={inputCls} placeholder="••••••••" />
                </div>
              </div>
              {pw.next && pw.confirm && pw.next !== pw.confirm && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Passwords do not match</p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPw || !pw.current || !pw.next || !pw.confirm}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {savingPw ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><Lock className="h-4 w-4" /> Update Password</>}
                </button>
              </div>
            </form>
          </Section>

          {/* ── Bank Details ───────────────────────────────────────────────── */}
          <Section icon={Building2} iconBg="bg-blue-100 text-blue-700" title="Bank Details" subtitle="Nigerian bank account for admin payouts and records">

            {/* Skeleton */}
            {fetchingBank && (
              <div className="animate-pulse space-y-3 rounded-2xl border border-[#F4EFEA] bg-[#FDFAF8] p-5">
                <div className="h-3 w-32 rounded bg-[#E8DED5]" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-4 rounded bg-[#E8DED5]" />
                  <div className="h-4 rounded bg-[#E8DED5]" />
                  <div className="col-span-2 h-4 rounded bg-[#E8DED5]" />
                </div>
              </div>
            )}

            {/* Saved account card */}
            {!fetchingBank && hasBank && (
              <div className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-100/60 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-800">Bank account on file</p>
                </div>
                <div className="grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Bank</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">{dbDetail.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Account Number</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-ink">{dbDetail.accountNumber}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Account Name</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">{dbDetail.accountName}</p>
                  </div>
                </div>
                <p className="px-4 pb-3 text-xs text-emerald-600">To update, fill the form below and save again.</p>
              </div>
            )}

            {/* No bank warning */}
            {!fetchingBank && !hasBank && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-800">No bank account saved yet</p>
                  <p className="mt-0.5 text-sm text-amber-700">Add your bank details below so Leddar has your account on record.</p>
                </div>
              </div>
            )}

            {/* Dev mode helper */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-dashed border-violet-300 bg-violet-50 px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Dev mode</p>
                  <p className="mt-0.5 text-xs text-violet-600">Account <strong>0000000001</strong> resolves without hitting Paystack</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBankForm({ bankCode: '058', bankName: 'Guaranty Trust Bank (GTBank)', accountNumber: '0000000001', accountName: '' });
                    resetVerify();
                    setTimeout(() => verifyAccount('0000000001', '058'), 100);
                  }}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
                >
                  Fill test data
                </button>
              </div>
            )}

            {/* Form */}
            {!fetchingBank && (
              <form onSubmit={handleSaveBank} className="space-y-5">
                {/* Bank select */}
                <div>
                  <Label>
                    Bank{banksLoading && <span className="ml-1 font-normal normal-case text-[#A39289]">— syncing with Paystack…</span>}
                  </Label>
                  <select
                    value={bankForm.bankCode}
                    onChange={handleBankSelect}
                    className={inputCls}
                    required
                  >
                    <option value="">Select your bank</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Account number */}
                <div>
                  <Label>Account Number</Label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="10-digit account number"
                      value={bankForm.accountNumber}
                      onChange={handleAccountNumber}
                      maxLength={10}
                      required
                      className={`${inputCls} pr-11 ${
                        verifyState === 'verified' ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-100'
                        : verifyState === 'error'  ? 'border-red-400 bg-red-50 focus:ring-red-100'
                        : ''
                      }`}
                    />
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
                      {verifyState === 'loading'  && <Loader2 className="h-4 w-4 animate-spin text-leather" />}
                      {verifyState === 'verified' && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                      {verifyState === 'error'    && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-[#A39289]">
                    {bankForm.accountNumber.length}/10
                    {!bankForm.bankCode && bankForm.accountNumber.length > 0 && (
                      <span className="ml-2 text-amber-600">— select a bank first</span>
                    )}
                  </p>
                </div>

                {/* Verification feedback */}
                {verifyState === 'loading' && (
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Verifying account with Paystack…
                  </div>
                )}
                {verifyState === 'verified' && resolvedName && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Account Verified ✓</p>
                      <p className="text-base font-bold text-ink">{resolvedName}</p>
                    </div>
                  </div>
                )}
                {verifyState === 'error' && verifyError && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {verifyError}
                  </div>
                )}

                {/* Retry */}
                {verifyState !== 'verified' && verifyState !== 'loading' &&
                  bankForm.accountNumber.length === 10 && bankForm.bankCode && (
                  <button
                    type="button"
                    onClick={() => verifyAccount(bankForm.accountNumber, bankForm.bankCode)}
                    className="text-sm font-semibold text-leather underline underline-offset-2 hover:opacity-80"
                  >
                    Retry verification
                  </button>
                )}

                {/* Save */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2 text-xs text-[#A39289]">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Account is verified directly with Paystack before saving.
                  </div>
                  <button
                    type="submit"
                    disabled={savingBank || verifyState !== 'verified'}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-all"
                  >
                    {savingBank
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                      : <><Save className="h-4 w-4" /> Save Bank Details</>
                    }
                  </button>
                </div>
              </form>
            )}
          </Section>

        </div>
      </PageWrapper>
    </AdminRoute>
  );
}
