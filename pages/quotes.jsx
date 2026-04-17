import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import QuoteRow from '@/components/admin/QuoteRow';
import { formatCurrency } from '@/lib/utils';
import { getQuotes, createQuote, sendProductionPricing } from '@/services/quotesService';
import { getCommissionSettings } from '@/services/commissionService';

const tabs = ['All', 'Sample Requests', 'Production Requests', 'Awaiting Production Pricing', 'Completed'];

export default function QuotesPage() {
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [quoteModal, setQuoteModal] = useState({ open: false, quote: null });
  const [productionModal, setProductionModal] = useState({ open: false, quote: null });
  const [quoteForm, setQuoteForm] = useState({ materialsCost: '', labourCost: '', moq: '', notes: '' });
  const [fullProductionPrice, setFullProductionPrice] = useState('');

  useEffect(() => {
    async function loadData() {
      const [quoteData, settingData] = await Promise.all([getQuotes(), getCommissionSettings()]);
      setRows(quoteData);
      setSettings(settingData);
    }

    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All') return rows;
    if (activeTab === 'Sample Requests') return rows.filter((item) => item.requestType === 'Sample Request');
    if (activeTab === 'Production Requests') return rows.filter((item) => item.requestType === 'Production Request');
    return rows.filter((item) => item.status === activeTab);
  }, [rows, activeTab]);

  const totalQuote = Number(quoteForm.materialsCost || 0) + Number(quoteForm.labourCost || 0);
  const productionPrice = Number(fullProductionPrice || 0);
  const sampleDeposit = settings?.sampleFlatFee || 0;
  const balanceDue = Math.max(productionPrice - sampleDeposit, 0);
  const adminPreview = Math.round((Number(settings?.adminCommissionPercent || 0) / 100) * productionPrice);
  const stage1Preview = Math.round((Number(settings?.artisanStage1Percent || 0) / 100) * productionPrice);
  const stage2Preview = Math.round((Number(settings?.artisanStage2Percent || 0) / 100) * productionPrice);

  const openCreateQuote = (quote) => {
    setQuoteForm({ materialsCost: '', labourCost: '', moq: '', notes: '' });
    setQuoteModal({ open: true, quote });
  };

  const openProductionPricing = (quote) => {
    setFullProductionPrice('');
    setProductionModal({ open: true, quote });
  };

  const refreshRows = async () => {
    const quoteData = await getQuotes();
    setRows(quoteData);
  };

  const submitCreateQuote = async (event) => {
    event.preventDefault();
    await createQuote({
      quoteId: quoteModal.quote.id,
      ...quoteForm,
    });
    setQuoteModal({ open: false, quote: null });
    await refreshRows();
  };

  const submitProductionPricing = async (event) => {
    event.preventDefault();
    await sendProductionPricing({
      quoteId: productionModal.quote.id,
      fullProductionPrice: productionPrice,
      balanceDue,
    });
    setProductionModal({ open: false, quote: null });
    await refreshRows();
  };

  return (
    <PageWrapper title="Quote Management">
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

      <Table headers={['Brand Name', 'Request Type', 'Product Type', 'Date', 'Status', 'Actions']}>
        {filteredRows.map((quote) => (
          <QuoteRow
            key={quote.id}
            quote={quote}
            onCreateQuote={openCreateQuote}
            onProductionPricing={openProductionPricing}
          />
        ))}
      </Table>

      <Modal title="Create Quote" open={quoteModal.open} onClose={() => setQuoteModal({ open: false, quote: null })}>
        <form className="grid gap-3" onSubmit={submitCreateQuote}>
          <label className="text-sm text-muted-300">
            Materials Cost (₦)
            <input
              type="number"
              value={quoteForm.materialsCost}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, materialsCost: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              required
            />
          </label>
          <label className="text-sm text-muted-300">
            Labour Cost (₦)
            <input
              type="number"
              value={quoteForm.labourCost}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, labourCost: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              required
            />
          </label>
          <label className="text-sm text-muted-300">
            MOQ
            <input
              type="number"
              value={quoteForm.moq}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, moq: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              required
            />
          </label>
          <label className="text-sm text-muted-300">
            Notes
            <textarea
              value={quoteForm.notes}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              rows={3}
            />
          </label>

          <div className="rounded-xl bg-neutral-100 p-3 text-sm">
            Calculated Total: <strong>{formatCurrency(totalQuote)}</strong>
          </div>

          <Button type="submit" variant="primary">Send Quote to Brand</Button>
        </form>
      </Modal>

      <Modal
        title="Send Production Pricing"
        open={productionModal.open}
        onClose={() => setProductionModal({ open: false, quote: null })}
      >
        <form className="space-y-3" onSubmit={submitProductionPricing}>
          <label className="text-sm text-muted-300 block">
            Full Production Price (₦)
            <input
              type="number"
              value={fullProductionPrice}
              onChange={(event) => setFullProductionPrice(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              required
            />
          </label>

          <div className="rounded-xl bg-neutral-100 p-4 text-sm space-y-2">
            <p>Sample deposit already paid: <strong>{formatCurrency(sampleDeposit)}</strong></p>
            <p className="text-gold font-bold">Balance Due: {formatCurrency(balanceDue)}</p>
            <p className="text-leather font-semibold">Admin Commission Preview ({settings?.adminCommissionPercent || 0}%): {formatCurrency(adminPreview)}</p>
            <p className="text-success font-semibold">Artisan Stage 1 Preview ({settings?.artisanStage1Percent || 0}%): {formatCurrency(stage1Preview)}</p>
            <p className="text-success font-semibold">Artisan Stage 2 Preview ({settings?.artisanStage2Percent || 0}%): {formatCurrency(stage2Preview)}</p>
          </div>

          <Button type="submit" variant="accent" className="w-full">Confirm and Send to Brand</Button>
        </form>
      </Modal>
    </PageWrapper>
  );
}
