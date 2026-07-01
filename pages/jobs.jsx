import { useEffect, useMemo, useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import JobRow from '@/components/admin/JobRow';
import { assignJob, getJobs, updateJobStatus } from '@/services/jobsService';
import { getVerifiedArtisans } from '@/services/artisansService';

const tabs = ['All Jobs', 'Sample Jobs', 'Production Jobs', 'Completed'];

export default function JobsPage() {
  const [rows, setRows] = useState([]);
  const [verifiedArtisans, setVerifiedArtisans] = useState([]);
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [assignModal, setAssignModal] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, job: null });
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    assignedArtisan: '',
    product: '',
    quantity: 1,
    specifications: '',
    referenceImages: '',
    deadline: '',
    jobType: 'Sample',
    brand: '',
  });

  useEffect(() => {
    async function loadData() {
      const [jobData, artisanData] = await Promise.all([getJobs(), getVerifiedArtisans()]);
      setRows(jobData);
      setVerifiedArtisans(artisanData);
      setForm((prev) => ({
        ...prev,
        assignedArtisan: artisanData[0]?.fullName || '',
      }));
    }

    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All Jobs') return rows;
    if (activeTab === 'Sample Jobs') return rows.filter((row) => row.jobType === 'Sample');
    if (activeTab === 'Production Jobs') return rows.filter((row) => row.jobType === 'Production');
    return rows.filter((row) => row.status === 'Completed');
  }, [rows, activeTab]);

  const refreshRows = async () => {
    setRows(await getJobs());
  };

  const submitAssign = async (event) => {
    event.preventDefault();
    await assignJob(form);
    setAssignModal(false);
    await refreshRows();
    setToast('New job assigned successfully.');
    setTimeout(() => setToast(''), 2000);
  };

  const handleReviewAction = async (action) => {
    if (!reviewModal.job) return;

    await updateJobStatus(reviewModal.job.id, action === 'forward' ? 'Video Sent' : 'Revision Requested');
    setReviewModal({ open: false, job: null });
    await refreshRows();
    setToast(action === 'forward' ? 'Video forwarded to brand.' : 'Revision requested from artisan.');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <PageWrapper title="Job Assignment" actions={<Button onClick={() => setAssignModal(true)}>Assign Job</Button>}>
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

      <Table headers={['Job ID', 'Job Type', 'Brand', 'Assigned Artisan', 'Product', 'Deadline', 'Status', 'Actions']}>
        {filteredRows.map((job) => (
          <JobRow key={job.id} job={job} onReviewVideo={(item) => setReviewModal({ open: true, job: item })} />
        ))}
      </Table>

      <Modal title="Assign Job" open={assignModal} onClose={() => setAssignModal(false)}>
        <form className="grid gap-3" onSubmit={submitAssign}>
          <label className="text-sm text-muted-300">
            Select Artisan (Verified only)
            <select
              value={form.assignedArtisan}
              onChange={(event) => setForm((prev) => ({ ...prev, assignedArtisan: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              required
            >
              {verifiedArtisans.map((artisan) => (
                <option key={artisan.id} value={artisan.fullName}>{artisan.fullName}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-muted-300">
              Brand
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
                value={form.brand}
                onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm text-muted-300">
              Product Type
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
                value={form.product}
                onChange={(event) => setForm((prev) => ({ ...prev, product: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm text-muted-300">
              Quantity
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
                value={form.quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="text-sm text-muted-300">
              Deadline
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
                value={form.deadline}
                onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
                required
              />
            </label>
            <label className="text-sm text-muted-300 sm:col-span-2">
              Job Type (from order)
              <select
                value={form.jobType}
                onChange={(event) => setForm((prev) => ({ ...prev, jobType: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              >
                <option value="Sample">Sample</option>
                <option value="Production">Production</option>
              </select>
            </label>
          </div>

          <label className="text-sm text-muted-300">
            Specifications
            <textarea
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              value={form.specifications}
              onChange={(event) => setForm((prev) => ({ ...prev, specifications: event.target.value }))}
              rows={3}
            />
          </label>

          <label className="text-sm text-muted-300">
            Reference Images
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-neutral-500 bg-cream px-3 py-2"
              placeholder="/mock/img-a.jpg, /mock/img-b.jpg"
              value={form.referenceImages}
              onChange={(event) => setForm((prev) => ({ ...prev, referenceImages: event.target.value }))}
            />
          </label>

          {form.jobType === 'Sample' ? (
            <p className="rounded-xl bg-neutral-100 p-3 text-sm text-muted-300">
              Produce 1 piece and record a video of the completed sample.
            </p>
          ) : null}

          <Button type="submit">Assign Job</Button>
        </form>
      </Modal>

<<<<<<< Updated upstream
      <Modal title="Review Video" open={reviewModal.open} onClose={() => setReviewModal({ open: false, job: null })}>
        <div className="space-y-4">
          <div className="aspect-video rounded-xl bg-neutral-200 p-4 text-sm text-muted-200">
            Video player preview for {reviewModal.job?.id}
          </div>
          <div className="flex gap-3">
            <Button variant="accent" onClick={() => handleReviewAction('forward')}>Forward to Brand</Button>
            <Button variant="danger" onClick={() => handleReviewAction('revision')}>Request Revision</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
=======
              <form className="space-y-4" onSubmit={submitAssign}>
                {/* Artisan filters */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#A39289] uppercase mb-1">Filter by Specialty</label>
                    <select
                      value={filterSpecialty}
                      onChange={(e) => { setFilterSpecialty(e.target.value); setSelectedArtisan(""); }}
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather bg-white"
                    >
                      <option value="">All Specialties</option>
                      {[
                        { value: "SHOES_AND_BOOTS",        label: "Shoes & Boots" },
                        { value: "SLIPPERS_AND_SANDALS",   label: "Slippers & Sandals" },
                        { value: "WOMEN_BAGS",             label: "Women Bags" },
                        { value: "OFFICE_AND_TRAVEL_BAGS", label: "Office & Travel Bags" },
                        { value: "WALLETS_AND_BELTS",      label: "Wallets & Belts" },
                        { value: "SMALL_LEATHER_GOODS",    label: "Small Leather Goods" },
                        { value: "LEATHER_WEARS",          label: "Leather Wears" },
                        { value: "OTHERS",                 label: "Others" },
                      ].map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#A39289] uppercase mb-1">Min. Capacity/wk</label>
                    <input
                      type="number"
                      min={0}
                      value={filterMinCapacity}
                      onChange={(e) => { setFilterMinCapacity(e.target.value); setSelectedArtisan(""); }}
                      placeholder="e.g. 10"
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                    />
                  </div>
                </div>

                {/* Artisan picker */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Select Artisan{" "}
                    <span className="text-xs font-normal text-[#A39289]">
                      ({filteredArtisans.length} KYC-verified
                      {filteredArtisans.length !== availableArtisans.length
                        ? `, filtered from ${availableArtisans.length}`
                        : ""})
                    </span>
                  </label>
                  {filteredArtisans.length === 0 ? (
                    <p className="text-sm text-amber-600 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      {availableArtisans.length === 0
                        ? "No KYC-verified artisans are currently available."
                        : "No artisans match the current filters."}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto rounded-xl border border-[#E8DED5] p-2">
                      {filteredArtisans.map((a) => {
                        const specs = Array.isArray(a.specialty) ? a.specialty : (a.specialty ? [a.specialty] : []);
                        const wasDeclined = a.previouslyDeclined;
                        const wasExpired  = a.previouslyExpired;
                        const wasRejected = wasDeclined || wasExpired;
                        return (
                          <label key={a.id}
                            className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors ${
                              selectedArtisan === a.id
                                ? "bg-atmosphere border border-leather"
                                : wasRejected
                                ? "hover:bg-red-50/50 border border-red-100 bg-red-50/30"
                                : "hover:bg-atmosphere/50 border border-transparent"
                            }`}>
                            <input
                              type="radio"
                              name="artisan"
                              value={a.id}
                              checked={selectedArtisan === a.id}
                              onChange={() => setSelectedArtisan(a.id)}
                              className="accent-leather"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink">{a.fullName}</p>
                              <p className="text-xs text-[#A39289]">
                                {a.user?.email || "—"}
                                {specs.length > 0 ? ` · ${specs.map(s => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())).join(", ")}` : ""}
                                {a.capacityPerWeek ? ` · ${a.capacityPerWeek} units/wk` : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {wasDeclined && (
                                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                  Declined
                                </span>
                              )}
                              {wasExpired && !wasDeclined && (
                                <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                                  Offer Expired
                                </span>
                              )}
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">KYC ✓</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Delivery Deadline (days from today) <span className="text-red-500">*</span>
                  </label>
                  {assignType === "PRODUCTION" && selectedOrder.quote?.timeline && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Set from brand&apos;s timeline: <strong>{TIMELINE_LABEL[selectedOrder.quote.timeline] || selectedOrder.quote.timeline}</strong>. Adjust if needed.
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={deadlineDays}
                      required
                      onChange={(e) => setDeadlineDays(e.target.value)}
                      className="w-28 rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                    />
                    <span className="text-sm text-[#A39289]">days</span>
                    {deadlineDays > 0 && (
                      <span className="text-xs text-[#6A5B54]">
                        → <strong>{new Date(Date.now() + Number(deadlineDays) * 86400000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs */}
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Additional Specifications{" "}
                    <span className="text-xs font-normal text-[#A39289]">
                      {selectedOrder.quote?.notes ? "(pre-filled from order — edit as needed)" : "(optional)"}
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    placeholder="Colour, size, finishing details..."
                    className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather resize-none"
                  />
                </div>

                {assignError && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />{assignError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="accent"
                    className="flex-1"
                    disabled={actionLoading || !selectedArtisan || !deadlineDays || deadlineDays < 1}
                  >
                    {actionLoading
                      ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" />Assigning...</span>
                      : "Confirm Assignment"
                    }
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAssignModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Modal>

        {/* ── ORDER JOBS MODAL ── */}
        <OrderJobsModal
          jobs={viewJobs}
          open={!!viewJobs}
          onClose={() => setViewJobs(null)}
          onActionDone={(msg) => { setViewJobs(null); loadAll(); showToast("✓ " + msg); }}
        />

      </PageWrapper>
    </AdminRoute>
>>>>>>> Stashed changes
  );
}
