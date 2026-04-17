import Button from '@/components/ui/Button';

export default function CommissionSettingsCard({
  currentSettings,
  form,
  total,
  isValid,
  onChange,
  onSubmit,
}) {
  return (
    <section className="rounded-xl bg-neutral-50 p-6 shadow-card">
      <h2 className="font-display text-xl font-bold text-ink">Current Settings</h2>
      <div className="mt-4 grid gap-3 text-sm text-muted-300 sm:grid-cols-2">
        <p>Admin Commission (Production Orders): <strong>{currentSettings.adminCommissionPercent}%</strong></p>
        <p>Artisan Stage 1 - Raw Materials: <strong>{currentSettings.artisanStage1Percent}%</strong></p>
        <p>Artisan Stage 2 - Service Fee: <strong>{currentSettings.artisanStage2Percent}%</strong></p>
        <p>Sample Order Admin Commission: <strong>{currentSettings.sampleAdminCommissionPercent}%</strong></p>
        <p>Sample Flat Fee: <strong>₦{currentSettings.sampleFlatFee.toLocaleString()}</strong></p>
      </div>

      <h3 className="mt-8 font-display text-lg font-bold text-ink">Update Settings</h3>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="text-sm text-muted-300">
          Admin Commission %
          <input
            type="number"
            name="adminCommissionPercent"
            value={form.adminCommissionPercent}
            onChange={onChange}
            className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
          />
        </label>
        <label className="text-sm text-muted-300">
          Artisan Stage 1 %
          <input
            type="number"
            name="artisanStage1Percent"
            value={form.artisanStage1Percent}
            onChange={onChange}
            className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
          />
        </label>
        <label className="text-sm text-muted-300">
          Artisan Stage 2 %
          <input
            type="number"
            name="artisanStage2Percent"
            value={form.artisanStage2Percent}
            onChange={onChange}
            className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
          />
        </label>
        <label className="text-sm text-muted-300">
          Sample Admin Commission %
          <input
            type="number"
            name="sampleAdminCommissionPercent"
            value={form.sampleAdminCommissionPercent}
            onChange={onChange}
            className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
          />
        </label>
        <label className="text-sm text-muted-300 sm:col-span-2">
          Sample Flat Fee
          <input
            type="number"
            name="sampleFlatFee"
            value={form.sampleFlatFee}
            onChange={onChange}
            className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
          />
        </label>

        <div className="sm:col-span-2">
          <p className="text-sm text-muted-300">Live production total: <strong>{total}%</strong></p>
          {!isValid ? <p className="mt-1 text-sm font-semibold text-danger">Percentages must sum to 100% before saving.</p> : null}
        </div>

        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-200">Changes apply to all future orders only. Existing orders retain the commission rate that was active when they were created.</p>
          <Button type="submit" variant="primary" disabled={!isValid}>Save Changes</Button>
        </div>
      </form>
    </section>
  );
}
