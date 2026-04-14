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
  );
}
