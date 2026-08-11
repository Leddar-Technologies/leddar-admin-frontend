import { useEffect, useState, useMemo } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import AdminRoute from "@/components/auth/AdminRoute";
import {
  getPendingSampleOrders,
  getPendingProductionOrders,
  getAvailableArtisans,
  assignSampleJob,
  assignProductionJob,
  getSampleCompletedOrders,
  getAllJobsFromOrders,
  approveVideo,
  rejectVideo,
  completeSample,
  dispatchProduction,
  confirmDelivery,
  presignAdminFile,
  cancelJob,
} from "@/services/jobsService";
import {
  ClipboardList, Users, Video, CheckCircle2,
  AlertCircle, Calendar, Package, RefreshCw,
  Eye, ChevronRight, User, Layers, EyeOff,
  Truck, Send, X,
} from "lucide-react";
import { formatDate, getErrorMessage } from "@/lib/utils";

// ─── Pipeline steps ────────────────────────────────────────────────────────

const SAMPLE_PIPELINE = [
  { key: "ASSIGNED",             label: "Assigned" },
  { key: "IN_PROGRESS",          label: "In Progress" },
  { key: "VIDEO_UPLOADED",       label: "Video Uploaded" },
  { key: "CORRECTION_REQUESTED", label: "Correction" },
  { key: "SAMPLE_APPROVED",      label: "Approved" },
  { key: "COMPLETED",            label: "Done" },
];

const PRODUCTION_PIPELINE = [
  { key: "ASSIGNED",         label: "Assigned" },
  { key: "IN_PROGRESS",      label: "In Progress" },
  { key: "VIDEO_UPLOADED",   label: "Video Sent" },
  { key: "PENDING_DELIVERY", label: "Ready" },
  { key: "DISPATCHED",       label: "Dispatched" },
  { key: "DELIVERED",        label: "Delivered" },
];

const STATUS_VARIANT = {
  ASSIGNED:             "warning",
  IN_PROGRESS:          "warning",
  VIDEO_UPLOADED:       "info",
  CORRECTION_REQUESTED: "warning",
  SAMPLE_APPROVED:      "success",
  PENDING_DELIVERY:     "info",
  DISPATCHED:           "info",
  DELIVERED:            "success",
  COMPLETED:            "success",
  DECLINED:             "error",
};

const ORDER_STATUS_LABEL = {
  SUBMITTED:          "Submitted",
  FLAT_FEE_PAID:      "Flat Fee Paid",
  SAMPLE_IN_PROGRESS: "Sample In Progress",
  SAMPLE_COMPLETED:   "Sample Completed",
  SAMPLE_APPROVED:    "Sample Approved",
  BALANCE_PAID:       "Balance Paid",
  IN_PRODUCTION:      "In Production",
  SHIPPED:            "Shipped",
  DELIVERED:          "Delivered",
};

const tabs = [
  { id: "all",     label: "All Jobs",          icon: Layers },
  { id: "pending", label: "Needs Assignment",  icon: ClipboardList },
  { id: "active",  label: "Active Jobs",       icon: Users },
  { id: "review",  label: "Sample Ready",      icon: Video },
];

// ─── Branding badges (brand metal tags, printed boxes, etc.) ───────────────

const BRANDING_NONE = "I don't need any of these";

function BrandingBadges({ items, className = "" }) {
  if (!items || items.length === 0) return null;
  const real = items.filter((i) => i !== BRANDING_NONE);
  if (real.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {real.map((item) => (
        <span
          key={item}
          className="inline-flex items-center rounded-full border border-[#F0D882] bg-[#FFF8EA] px-2 py-0.5 text-[10px] font-semibold text-[#8A6A00]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── Pipeline Stepper ──────────────────────────────────────────────────────

function PipelineStepper({ type, currentStatus }) {
  const steps = type === "SAMPLE" ? SAMPLE_PIPELINE : PRODUCTION_PIPELINE;
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);
  const declined = currentStatus === "DECLINED";

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done    = !declined && i < currentIdx;
        const active  = !declined && i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className={`flex flex-col items-center`}>
              <div className={`h-2 w-2 rounded-full ${
                declined ? "bg-red-300"
                : done    ? "bg-emerald-500"
                : active  ? "bg-amber-500"
                : "bg-[#D7CBC1]"
              }`} />
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-4 ${done ? "bg-emerald-400" : "bg-[#E8DED5]"}`} />
            )}
          </div>
        );
      })}
      {declined && (
        <span className="ml-1 text-[10px] font-bold text-red-500">DECLINED</span>
      )}
    </div>
  );
}

// ─── Single Job Panel (used inside OrderJobsModal) ─────────────────────────

function JobPanel({ job, onActionDone }) {
  const [actionLoading, setActionLoading]     = useState(false);
  const [actionError, setActionError]         = useState("");
  const [adminVideoStatus, setAdminVideoStatus] = useState(job?.adminVideoStatus || null);
  const [signedVideoUrl, setSignedVideoUrl]   = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote]           = useState("");
  const [rejectLoading, setRejectLoading]     = useState(false);

  useEffect(() => {
    if (!job?.videoUrl) { setSignedVideoUrl(null); return; }
    presignAdminFile(job.videoUrl)
      .then(setSignedVideoUrl)
      .catch(() => setSignedVideoUrl(job.videoUrl));
  }, [job?.videoUrl]);

  if (!job) return null;
  const steps = job.type === "SAMPLE" ? SAMPLE_PIPELINE : PRODUCTION_PIPELINE;
  const currentIdx = steps.findIndex((s) => s.key === job.status);
  const declined = job.status === "DECLINED";

  async function handleApproveVideo() {
    setActionLoading(true); setActionError("");
    try {
      await approveVideo(job.id);
      setAdminVideoStatus("APPROVED");
      onActionDone("Video approved and sent to brand ✓");
    } catch (e) { setActionError(getErrorMessage(e)); }
    finally { setActionLoading(false); }
  }

  async function handleRejectVideo(e) {
    e.preventDefault();
    if (!rejectNote.trim()) return;
    setRejectLoading(true); setActionError("");
    try {
      await rejectVideo(job.id, rejectNote.trim());
      setAdminVideoStatus("REJECTED");
      setRejectModalOpen(false);
      setRejectNote("");
      onActionDone("Video rejected — artisan notified ✓");
    } catch (e) { setActionError(getErrorMessage(e)); }
    finally { setRejectLoading(false); }
  }

  async function handleCompleteSample() {
    setActionLoading(true); setActionError("");
    try { await completeSample(job.id); onActionDone("Sample marked as completed ✓"); }
    catch (e) { setActionError(getErrorMessage(e)); }
    finally { setActionLoading(false); }
  }

  async function handleDispatch() {
    setActionLoading(true); setActionError("");
    try { await dispatchProduction(job.id); onActionDone("Production marked as dispatched ✓"); }
    catch (e) { setActionError(getErrorMessage(e)); }
    finally { setActionLoading(false); }
  }

  async function handleCancelJob() {
    if (!window.confirm("Cancel this job assignment? The order will return to the assignment queue.")) return;
    setActionLoading(true); setActionError("");
    try { await cancelJob(job.id); onActionDone("Job cancelled — order returned to assignment queue ✓"); }
    catch (e) { setActionError(getErrorMessage(e)); }
    finally { setActionLoading(false); }
  }

  async function handleConfirmDelivery() {
    setActionLoading(true); setActionError("");
    try { await confirmDelivery(job.id); onActionDone("Delivery confirmed ✓ — order marked as delivered"); }
    catch (e) { setActionError(getErrorMessage(e)); }
    finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-4">
      {/* Job type + status */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={job.type === "SAMPLE" ? "warning" : "info"}>{job.type}</Badge>
        <Badge variant={STATUS_VARIANT[job.status] || "default"}>{job.status?.replace(/_/g, " ")}</Badge>
        <span className="ml-auto text-xs text-[#A39289]">
          Order: <strong>{ORDER_STATUS_LABEL[job.orderStatus] || job.orderStatus}</strong>
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {job.deadline && (
          <div>
            <p className="text-xs text-[#A39289] uppercase mb-0.5">Deadline</p>
            <p className="text-ink flex items-center gap-1"><Calendar className="h-3 w-3 text-[#A39289]" />{formatDate(job.deadline)}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-[#A39289] uppercase mb-0.5">Assigned</p>
          <p className="text-ink">{formatDate(job.createdAt)}</p>
        </div>
      </div>

      {/* Pipeline stepper */}
      <div className="flex items-start">
        {steps.map((step, i) => {
          const done   = !declined && i < currentIdx;
          const active = !declined && i === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                  declined && i <= currentIdx ? "border-red-300 bg-red-50 text-red-400"
                  : done    ? "border-emerald-500 bg-emerald-500 text-white"
                  : active  ? "border-leather bg-leather text-white"
                  : "border-[#D7CBC1] bg-white text-[#A39289]"
                }`}>{done ? "✓" : i + 1}</div>
                <p className={`mt-1 text-center text-[10px] font-semibold leading-tight ${
                  active ? "text-leather" : done ? "text-emerald-600" : "text-[#A39289]"
                }`}>{step.label}</p>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mb-4 ${done ? "bg-emerald-400" : "bg-[#E8DED5]"}`} />
              )}
            </div>
          );
        })}
      </div>
      {declined && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Declined — returned for reassignment.
        </p>
      )}

      {/* Artisan */}
      <div className="flex items-center gap-3 rounded-xl border border-[#E8DED5] bg-white p-3">
        <div className="h-8 w-8 rounded-full bg-atmosphere flex items-center justify-center text-leather font-bold text-sm shrink-0">
          {job.artisanName?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm">{job.artisanName}</p>
          <p className="text-xs text-[#A39289] truncate">{job.artisanEmail}</p>
          {job.artisanSpecialty?.length > 0 && (
            <p className="text-xs text-[#6A5B54] mt-0.5">
              {job.artisanSpecialty.map((s) => s.replace(/_/g, " ")).join(", ")}
              {job.artisanCapacity ? ` · ${job.artisanCapacity} units/wk` : ""}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">KYC ✓</span>
      </div>

      {/* Cancel — only while still awaiting artisan acceptance, so in-progress work is never wiped out */}
      {job.status === "ASSIGNED" && (
        <button
          onClick={handleCancelJob}
          disabled={actionLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
        >
          <X className="h-4 w-4" />
          {actionLoading ? "Cancelling…" : "Cancel Job (return to assignment queue)"}
        </button>
      )}

      {/* Corrections */}
      {job.type === "SAMPLE" && job.correctionCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Corrections: {job.correctionCount}/2</p>
          {job.correctionNote && <p className="text-xs text-amber-900">{job.correctionNote}</p>}
        </div>
      )}

      {/* Video — shown for both SAMPLE and PRODUCTION */}
      {(job.type === "SAMPLE" || job.type === "PRODUCTION") && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289]">
              {job.type === "PRODUCTION" ? "Production Completion Video" : "Sample Video"}
            </p>
            {job.videoUrl && adminVideoStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                adminVideoStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : adminVideoStatus === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {adminVideoStatus === "APPROVED"
                  ? (job.type === "PRODUCTION" ? "Approved — ready for dispatch" : "Approved — visible to brand")
                  : adminVideoStatus === "REJECTED" ? "Rejected"
                  : "Pending review"}
              </span>
            )}
          </div>
          {job.videoUrl ? (
            <>
              {/* Hide video when rejected — artisan must re-upload before admin can review */}
              {adminVideoStatus === "REJECTED" ? (
                <div className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 h-24 text-sm text-red-600 font-medium">
                  Video rejected — waiting for artisan to re-upload
                </div>
              ) : signedVideoUrl ? (
                <video src={signedVideoUrl} controls className="w-full rounded-xl bg-black max-h-48" />
              ) : (
                <div className="flex items-center justify-center rounded-xl bg-black h-32 text-white/50 text-sm">Loading video…</div>
              )}
              {adminVideoStatus !== "REJECTED" && job.updates?.find((u) => u.message) && (
                <div className="mt-2 rounded-xl border border-[#E8DED5] bg-atmosphere p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A39289] mb-1">Artisan&apos;s Note</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">{job.updates.find((u) => u.message).message}</p>
                </div>
              )}
              {adminVideoStatus !== "APPROVED" && adminVideoStatus !== "REJECTED" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleApproveVideo}
                    disabled={actionLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    {actionLoading ? "Approving…" : job.type === "PRODUCTION" ? "Approve & Ready for Dispatch" : "Approve & Send to Brand"}
                  </button>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Reject with Reason
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-atmosphere border border-[#E8DED5] px-3 py-2.5 text-sm text-[#A39289]">
              <Video className="h-4 w-4" />
              {job.type === "PRODUCTION" ? "Awaiting completion video from artisan" : "Awaiting artisan upload"}
            </div>
          )}

          {/* Rejection modal */}
          {rejectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-ink text-base">Reject Video</h3>
                  <button onClick={() => setRejectModalOpen(false)} className="text-[#A39289] hover:text-ink">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-[#6A5B54]">
                  Provide a reason for rejection. The artisan will be notified and can re-upload after making corrections.
                </p>
                <form onSubmit={handleRejectVideo} className="space-y-3">
                  <textarea
                    rows={4}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="e.g. The stitching is uneven on the left side. Please redo and re-upload."
                    required
                    className="w-full rounded-xl border border-[#E8DED5] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={rejectLoading || !rejectNote.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                      {rejectLoading ? "Sending…" : "Confirm Rejection"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejectModalOpen(false); setRejectNote(""); }}
                      className="flex-1 rounded-xl border border-[#E8DED5] px-4 py-2.5 text-sm font-semibold text-[#6A5B54] hover:bg-atmosphere transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Branding requested by brand */}
      {job.brandProvides?.filter((i) => i !== BRANDING_NONE).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1">Branding Requested</p>
          <BrandingBadges items={job.brandProvides} />
        </div>
      )}

      {/* Specs */}
      {job.specifications && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289] mb-1">Specifications</p>
          <p className="rounded-xl border border-[#E8DED5] bg-atmosphere px-3 py-2.5 text-sm text-ink whitespace-pre-wrap">{job.specifications}</p>
        </div>
      )}

      {actionError && (
        <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />{actionError}</p>
      )}

      {job.type === "SAMPLE" && job.status === "SAMPLE_APPROVED" && (
        <button
          onClick={handleCompleteSample}
          disabled={actionLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          {actionLoading ? "Processing…" : "Complete Sample & Create Production Job"}
        </button>
      )}

      {job.type === "PRODUCTION" && job.status === "PENDING_DELIVERY" && (
        <button
          onClick={handleDispatch}
          disabled={actionLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          <Truck className="h-4 w-4" />
          {actionLoading ? "Dispatching…" : "Mark as Dispatched"}
        </button>
      )}

      {job.type === "PRODUCTION" && job.status === "DISPATCHED" && (
        <button
          onClick={handleConfirmDelivery}
          disabled={actionLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          <CheckCircle2 className="h-4 w-4" />
          {actionLoading ? "Confirming…" : "Confirm Delivery"}
        </button>
      )}
    </div>
  );
}

// ─── Order Jobs Modal (1 or 2 jobs for the same order) ─────────────────────

function OrderJobsModal({ jobs, open, onClose, onActionDone }) {
  const [activeJobId, setActiveJobId] = useState(null);

  useEffect(() => {
    if (jobs?.length) setActiveJobId(jobs[0].id);
  }, [jobs]);

  if (!jobs?.length) return null;
  const first = jobs[0];
  const activeJob = jobs.find((j) => j.id === activeJobId) || jobs[0];

  return (
    <Modal title="Order Details" open={open} onClose={onClose}>
      <div className="space-y-5">
        {/* Order / Brand / Product header */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E8DED5] bg-atmosphere p-4 text-sm">
          <div>
            <p className="text-xs text-[#A39289] uppercase mb-0.5">Order Ref</p>
            <p className="font-mono font-bold text-leather">{first.orderRef}</p>
          </div>
          <div>
            <p className="text-xs text-[#A39289] uppercase mb-0.5">Quote Ref</p>
            <p className="font-mono font-bold text-leather">{first.quoteRef || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#A39289] uppercase mb-0.5">Brand</p>
            <p className="font-semibold text-ink">{first.brandName}</p>
          </div>
          <div>
            <p className="text-xs text-[#A39289] uppercase mb-0.5">Product</p>
            <p className="text-ink">{first.productType}</p>
          </div>
          <div>
            <p className="text-xs text-[#A39289] uppercase mb-0.5">Quantity</p>
            <p className="text-ink">{first.quantity}</p>
          </div>
          {first.brandProvides?.filter((i) => i !== BRANDING_NONE).length > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-[#A39289] uppercase mb-1">Branding Requested</p>
              <BrandingBadges items={first.brandProvides} />
            </div>
          )}
        </div>

        {/* Job selector tabs (only shown when 2 jobs) */}
        {jobs.length > 1 && (
          <div className="flex gap-2">
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setActiveJobId(j.id)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                  activeJobId === j.id
                    ? j.type === "SAMPLE" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-[#E8DED5] bg-white text-[#6A5B54] hover:bg-atmosphere"
                }`}
              >
                {j.type === "SAMPLE" ? "Sample Job" : "Production Job"}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  j.status === "COMPLETED" || j.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700"
                  : j.status === "DECLINED" ? "bg-red-100 text-red-600"
                  : "bg-[#F4EFEA] text-[#A39289]"
                }`}>{j.status?.replace(/_/g, " ")}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active job panel */}
        <JobPanel key={activeJob.id} job={activeJob} onActionDone={onActionDone} />

        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [activeTab, setActiveTab]         = useState("pending");
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]                 = useState("");

  // Data
  const [pendingSample, setPendingSample]         = useState([]);
  const [pendingProduction, setPendingProduction] = useState([]);
  const [availableArtisans, setAvailableArtisans] = useState([]);
  const [activeJobs, setActiveJobs]               = useState([]);
  const [sampleReadyOrders, setSampleReadyOrders] = useState([]);

  // Assignment modal
  const [assignModal, setAssignModal]         = useState(false);
  const [assignType, setAssignType]           = useState("SAMPLE");
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [selectedArtisan, setSelectedArtisan] = useState("");
  const [specifications, setSpecifications]   = useState("");
  const [assignError, setAssignError]         = useState("");
  const [deadlineDays, setDeadlineDays]       = useState(2);
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterMinCapacity, setFilterMinCapacity] = useState("");
  const [filterProducesFor, setFilterProducesFor] = useState("");

  // Active jobs filters
  const [filterJobType, setFilterJobType]     = useState("");
  const [filterJobStatus, setFilterJobStatus] = useState("");
  const [filterSearch, setFilterSearch]       = useState("");

  // Job details modal — holds an array of jobs (1 or 2) for the same order
  const [viewJobs, setViewJobs] = useState(null);



  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sp, pp, aa, aj, sc] = await Promise.allSettled([
        getPendingSampleOrders(),
        getPendingProductionOrders(),
        getAvailableArtisans(),
        getAllJobsFromOrders(),
        getSampleCompletedOrders(),
      ]);
      if (sp.status === "fulfilled") setPendingSample(sp.value);
      if (pp.status === "fulfilled") setPendingProduction(pp.value);
      if (aa.status === "fulfilled") setAvailableArtisans(aa.value);
      if (aj.status === "fulfilled") setActiveJobs(aj.value);
      if (sc.status === "fulfilled") setSampleReadyOrders(sc.value);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const TIMELINE_DAYS = {
    URGENT_1_2_WEEKS: 14,
    WEEKS_3_4:        28,
    MONTHS_1_2:       60,
    MONTHS_2_3:       90,
    FLEXIBLE:         120, // 4 months — admin can adjust if needed
  };

  const TIMELINE_LABEL = {
    URGENT_1_2_WEEKS: "1–2 weeks (urgent)",
    WEEKS_3_4:        "3–4 weeks",
    MONTHS_1_2:       "1–2 months",
    MONTHS_2_3:       "2–3 months",
    FLEXIBLE:         "Flexible (4 months default)",
  };

  const PRODUCES_FOR_LABEL = {
    MALE:   "Male Wear",
    FEMALE: "Female Wear",
    UNISEX: "Unisex / Both",
  };

  const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const openAssign = async (order, type) => {
    setSelectedOrder(order);
    setAssignType(type);
    setSelectedArtisan("");
    setSpecifications(order.quote?.notes || "");
    // Fetch artisans flagged for this specific order (previouslyDeclined / previouslyExpired)
    try {
      const artisans = await getAvailableArtisans(order.id);
      setAvailableArtisans(artisans);
    } catch (_) { /* keep stale list */ }
    // Sample defaults to 2 days; production uses the brand's timeline
    const defaultDays = type === "SAMPLE"
      ? 2
      : (TIMELINE_DAYS[order.quote?.timeline] || 14);
    setDeadlineDays(defaultDays);
    setAssignError("");
    setFilterSpecialty("");
    setFilterMinCapacity("");
    setFilterProducesFor("");
    setAssignModal(true);
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    if (!selectedArtisan)          { setAssignError("Please select an artisan."); return; }
    if (!selectedOrder)            { setAssignError("No order selected."); return; }
    if (!deadlineDays || deadlineDays < 1) { setAssignError("Please set a valid number of days."); return; }
    setActionLoading(true);
    setAssignError("");
    try {
      const payload = {
        orderId:        selectedOrder.id,
        artisanId:      selectedArtisan,
        specifications: specifications || selectedOrder.quote?.notes || "",
        deadline:       daysFromNow(Number(deadlineDays)),
      };
      if (assignType === "SAMPLE") await assignSampleJob(payload);
      else                         await assignProductionJob(payload);
      setAssignModal(false);
      await loadAll();
      showToast("✓ Job assigned to artisan successfully.");
    } catch (err) {
      setAssignError(getErrorMessage(err, "Failed to assign job."));
    } finally {
      setActionLoading(false);
    }
  };

  const pendingAll = useMemo(() => [
    ...pendingSample.map((o) => ({ ...o, _assignType: "SAMPLE" })),
    ...pendingProduction.map((o) => ({ ...o, _assignType: "PRODUCTION" })),
  ], [pendingSample, pendingProduction]);

  // Shared search/type predicate — reused across all three tabs so the filter bar
  // works no matter which tab is open, not just Active Jobs.
  const matchesSearch = (hayFields) => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return hayFields.some((f) => f?.toLowerCase().includes(q));
  };

  // Pending assignment orders have no job status yet, so only search + type apply.
  const filteredPendingAll = useMemo(() => pendingAll.filter((order) => {
    if (filterJobType && order._assignType !== filterJobType) return false;
    return matchesSearch([
      order.ref,
      order.brand?.businessName,
      order.quote?.productType?.[0],
      order.quote?.ref,
    ]);
  }), [pendingAll, filterJobType, filterSearch]);

  const filteredJobs = useMemo(() => activeJobs.filter((j) => {
    // By default, hide finished jobs (matches the "Active Jobs" badge count) —
    // an explicit status filter (e.g. "Completed") overrides this.
    if (!filterJobStatus && ["COMPLETED", "DECLINED", "DELIVERED"].includes(j.status)) return false;
    if (filterJobType   && j.type !== filterJobType) return false;
    if (filterJobStatus && j.status !== filterJobStatus) return false;
    return matchesSearch([j.brandName, j.artisanName, j.orderRef, j.quoteRef, j.productType]);
  }), [activeJobs, filterJobType, filterJobStatus, filterSearch]);

  // Sample Ready — jobs awaiting admin video review.
  const filteredVideoJobs = useMemo(() => activeJobs.filter((j) => {
    if (!["VIDEO_UPLOADED", "CORRECTION_REQUESTED", "SAMPLE_APPROVED"].includes(j.status)) return false;
    if (filterJobType   && j.type !== filterJobType) return false;
    if (filterJobStatus && j.status !== filterJobStatus) return false;
    return matchesSearch([j.brandName, j.artisanName, j.orderRef, j.quoteRef, j.productType]);
  }), [activeJobs, filterJobType, filterJobStatus, filterSearch]);

  // "All Jobs" tab — every job at every stage (including completed/declined),
  // so search isn't scoped to a single category.
  const filteredEveryJob = useMemo(() => activeJobs.filter((j) => {
    if (filterJobType   && j.type !== filterJobType) return false;
    if (filterJobStatus && j.status !== filterJobStatus) return false;
    return matchesSearch([j.brandName, j.artisanName, j.orderRef, j.quoteRef, j.productType]);
  }), [activeJobs, filterJobType, filterJobStatus, filterSearch]);

  const groupJobsByOrder = (list) => {
    const map = new Map();
    list.forEach((job) => {
      const key = job.orderRef || job.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(job);
    });
    return Array.from(map.values()).map((group) =>
      group.sort((a, b) => (a.type === "SAMPLE" ? -1 : 1))
    );
  };

  // Group filtered jobs by orderRef so SAMPLE + PRODUCTION from the same order merge into one row
  const groupedJobs    = useMemo(() => groupJobsByOrder(filteredJobs),     [filteredJobs]);
  const groupedAllJobs = useMemo(() => groupJobsByOrder(filteredEveryJob), [filteredEveryJob]);

  const filteredArtisans = useMemo(() => {
    const filtered = availableArtisans.filter((a) => {
      const specs = Array.isArray(a.specialty) ? a.specialty : (a.specialty ? [a.specialty] : []);
      if (filterSpecialty && !specs.includes(filterSpecialty)) return false;
      if (filterMinCapacity && (a.capacityPerWeek || 0) < Number(filterMinCapacity)) return false;
      // Artisans who haven't set producesFor yet shouldn't be hidden by every filter —
      // only exclude when they've explicitly set a value that doesn't match.
      if (filterProducesFor && a.producesFor && a.producesFor !== filterProducesFor) return false;
      return true;
    });
    // Sort: fresh artisans first, previously declined/expired last
    return filtered.sort((a, b) => {
      const aRejected = a.previouslyDeclined || a.previouslyExpired ? 1 : 0;
      const bRejected = b.previouslyDeclined || b.previouslyExpired ? 1 : 0;
      return aRejected - bRejected;
    });
  }, [availableArtisans, filterSpecialty, filterMinCapacity, filterProducesFor]);

  return (
    <AdminRoute>
      <PageWrapper
        title="Job Assignment"
        subtitle="Assign artisans to orders and manage the production pipeline"
      >
        {/* Toast */}
        {toast && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            toast.startsWith("✓")
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {toast}
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Needs Assignment", value: pendingAll.length,          color: "text-amber-600",   bg: "bg-amber-50"   },
            { label: "Active Jobs",      value: activeJobs.filter(j => !["COMPLETED","DECLINED","DELIVERED"].includes(j.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Sample Ready",     value: sampleReadyOrders.length,   color: "text-leather",     bg: "bg-[#FFF8EA]"  },
            { label: "Completed",        value: activeJobs.filter(j => j.status === "COMPLETED").length, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border border-[#E8DED5] ${c.bg} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#A39289]">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-1.5 shadow-sm border border-[#E8DED5]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const reviewCount = activeJobs.filter((j) =>
                ["VIDEO_UPLOADED", "CORRECTION_REQUESTED", "SAMPLE_APPROVED"].includes(j.status)
              ).length;
              const badge = tab.id === "all"     ? pendingAll.length + activeJobs.length
                : tab.id === "pending" ? pendingAll.length
                : tab.id === "review"  ? reviewCount
                : tab.id === "active"  ? activeJobs.filter(j => !["COMPLETED","DECLINED","DELIVERED"].includes(j.status)).length
                : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    isActive ? "bg-leather text-white shadow-md" : "text-[#6A5B54] hover:bg-atmosphere"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {badge != null && badge > 0 && (
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                    }`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#E8DED5] bg-white px-3 py-2 text-sm font-medium text-[#6A5B54] hover:bg-atmosphere"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" color="leather" />
          </div>
        ) : (
          <>
            {/* Filters — apply to whichever tab is active, not just Active Jobs */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-[#E8DED5] bg-white p-4 shadow-sm">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-semibold uppercase text-[#A39289] mb-1">Search</label>
                <input
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Brand, artisan, order ref, quote ref…"
                  className="w-full rounded-xl border border-[#E8DED5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather"
                />
              </div>
              <div className="min-w-[130px]">
                <label className="block text-xs font-semibold uppercase text-[#A39289] mb-1">Job Type</label>
                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  className="w-full rounded-xl border border-[#E8DED5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather bg-white"
                >
                  <option value="">All Types</option>
                  <option value="SAMPLE">Sample</option>
                  <option value="PRODUCTION">Production</option>
                </select>
              </div>
              {activeTab !== "pending" && (
                <div className="min-w-[160px]">
                  <label className="block text-xs font-semibold uppercase text-[#A39289] mb-1">Job Status</label>
                  <select
                    value={filterJobStatus}
                    onChange={(e) => setFilterJobStatus(e.target.value)}
                    className="w-full rounded-xl border border-[#E8DED5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="VIDEO_UPLOADED">Video Uploaded</option>
                    <option value="CORRECTION_REQUESTED">Correction Requested</option>
                    <option value="SAMPLE_APPROVED">Sample Approved</option>
                    <option value="PENDING_DELIVERY">Ready for Dispatch</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
              )}
              {(filterSearch || filterJobType || filterJobStatus) && (
                <div className="flex items-end">
                  <button
                    onClick={() => { setFilterSearch(""); setFilterJobType(""); setFilterJobStatus(""); }}
                    className="rounded-xl border border-[#E8DED5] px-3 py-2 text-xs font-semibold text-[#A39289] hover:bg-atmosphere"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* ── ALL JOBS ── */}
            {activeTab === "all" && (
              <div className="space-y-4">
                {/* Orders still waiting for an artisan */}
                {filteredPendingAll.length > 0 && (
                  <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                    <div className="border-b border-[#F4EFEA] bg-atmosphere/40 px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-wider text-[#A39289]">
                        Needs Assignment ({filteredPendingAll.length})
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F4EFEA] bg-atmosphere/20">
                            {["Order ID", "Brand", "Product", "Qty", "Timeline", "Date", "Action"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4EFEA]">
                          {filteredPendingAll.map((order) => (
                            <tr key={order.id} className="hover:bg-atmosphere/20 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-mono text-xs font-bold text-leather">
                                  {order.ref || `#${order.id.slice(0, 8).toUpperCase()}`}
                                </p>
                                <Badge variant={order._assignType === "SAMPLE" ? "warning" : "info"} className="mt-1">
                                  {order._assignType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-ink font-medium">{order.brand?.businessName || "—"}</td>
                              <td className="px-4 py-3 text-[#5A4A44]">{order.quote?.productType?.[0] || "—"}</td>
                              <td className="px-4 py-3 text-[#5A4A44]">{order.quote?.quantity || "—"}</td>
                              <td className="px-4 py-3 text-xs text-[#5A4A44]">
                                {order.quote?.timeline
                                  ? (TIMELINE_LABEL[order.quote.timeline] || order.quote.timeline.replace(/_/g, " "))
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-[#A39289] text-xs">{formatDate(order.createdAt)}</td>
                              <td className="px-4 py-3">
                                <Button size="sm" variant="accent" onClick={() => openAssign(order, order._assignType)}>
                                  Assign Artisan
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Every job that has been assigned, at any stage */}
                <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                  {groupedAllJobs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center">
                      <Package className="h-12 w-12 text-[#D7CBC1]" />
                      <p className="font-semibold text-ink">
                        {activeJobs.length === 0 && filteredPendingAll.length === 0 ? "No jobs yet" : "No jobs match the filters"}
                      </p>
                      <p className="text-sm text-[#A39289]">
                        {activeJobs.length === 0 && filteredPendingAll.length === 0
                          ? "Jobs will appear here once orders are assigned to artisans."
                          : "Try adjusting or clearing your filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                            {["Order Ref", "Brand", "Product", "Artisan", "Deadline", "Pipeline", "Job Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4EFEA]">
                          {groupedAllJobs.map((group) => {
                            const displayJob = group.find((j) => j.type === "PRODUCTION") || group[0];
                            return (
                              <tr key={displayJob.orderRef || displayJob.id} className="hover:bg-atmosphere/20 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-mono text-xs font-bold text-leather">{displayJob.orderRef}</p>
                                  {displayJob.quoteRef && (
                                    <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{displayJob.quoteRef}]</p>
                                  )}
                                  <Badge variant={displayJob.type === "SAMPLE" ? "warning" : "info"} className="mt-1">
                                    {displayJob.type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 font-medium text-ink">{displayJob.brandName}</td>
                                <td className="px-4 py-3 text-[#5A4A44] text-xs">{displayJob.productType}</td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-ink">{displayJob.artisanName}</p>
                                  <p className="text-xs text-[#A39289] truncate max-w-[120px]">{displayJob.artisanEmail}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-[#A39289]">
                                  {displayJob.deadline
                                    ? formatDate(displayJob.deadline)
                                    : displayJob.quoteTimeline
                                      ? <span title="Brand's requested timeline">{TIMELINE_LABEL[displayJob.quoteTimeline] || displayJob.quoteTimeline}</span>
                                      : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <PipelineStepper type={displayJob.type} currentStatus={displayJob.status} />
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={STATUS_VARIANT[displayJob.status] || "default"}>
                                    {displayJob.status?.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setViewJobs(group)}
                                    className="flex items-center gap-1.5 rounded-xl border border-[#E8DED5] bg-white px-3 py-1.5 text-xs font-semibold text-[#6A5B54] hover:bg-atmosphere transition-colors"
                                  >
                                    <Eye className="h-3 w-3" /> View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="border-t border-[#F4EFEA] px-4 py-2 text-xs text-[#A39289]">
                        Showing {groupedAllJobs.length} order{groupedAllJobs.length !== 1 ? "s" : ""} ({filteredEveryJob.length} jobs) of {activeJobs.length} total
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PENDING ASSIGNMENT ── */}
            {activeTab === "pending" && (
              <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                {filteredPendingAll.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                    <p className="font-semibold text-ink">
                      {pendingAll.length === 0 ? "All orders are assigned" : "No orders match the filters"}
                    </p>
                    <p className="text-sm text-[#A39289]">
                      {pendingAll.length === 0
                        ? "No orders are waiting for artisan assignment."
                        : "Try adjusting or clearing your filters."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                          {["Order ID", "Brand", "Product", "Qty", "Timeline", "Date", "Action"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4EFEA]">
                        {filteredPendingAll.map((order) => (
                          <tr key={order.id} className="hover:bg-atmosphere/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs font-bold text-leather">
                                {order.ref || `#${order.id.slice(0, 8).toUpperCase()}`}
                              </p>
                              <Badge variant={order._assignType === "SAMPLE" ? "warning" : "info"} className="mt-1">
                                {order._assignType}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-ink font-medium">
                              {order.brand?.businessName || "—"}
                            </td>
                            <td className="px-4 py-3 text-[#5A4A44]">
                              {order.quote?.productType?.[0] || "—"}
                              <BrandingBadges items={order.quote?.brandProvides} className="mt-1" />
                            </td>
                            <td className="px-4 py-3 text-[#5A4A44]">
                              {order.quote?.quantity || "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#5A4A44]">
                              {order.quote?.timeline
                                ? (TIMELINE_LABEL[order.quote.timeline] || order.quote.timeline.replace(/_/g, " "))
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-[#A39289] text-xs">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => openAssign(order, order._assignType)}
                              >
                                Assign Artisan
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE JOBS ── */}
            {activeTab === "active" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                  {filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center">
                      <Package className="h-12 w-12 text-[#D7CBC1]" />
                      <p className="font-semibold text-ink">
                        {activeJobs.length === 0 ? "No active jobs yet" : "No jobs match the filters"}
                      </p>
                      <p className="text-sm text-[#A39289]">
                        {activeJobs.length === 0
                          ? "Assign artisans to orders to see jobs here."
                          : "Try adjusting or clearing your filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#F4EFEA] bg-atmosphere/40">
                            {["Order Ref", "Brand", "Product", "Artisan", "Deadline", "Pipeline", "Job Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4EFEA]">
                          {groupedJobs.map((group) => {
                            // If the group has a PRODUCTION job, use it as the display job.
                            // Otherwise fall back to the SAMPLE job.
                            const displayJob = group.find((j) => j.type === "PRODUCTION") || group[0];
                            return (
                              <tr key={displayJob.orderRef || displayJob.id} className="hover:bg-atmosphere/20 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-mono text-xs font-bold text-leather">{displayJob.orderRef}</p>
                                  {displayJob.quoteRef && (
                                    <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{displayJob.quoteRef}]</p>
                                  )}
                                  <Badge variant={displayJob.type === "SAMPLE" ? "warning" : "info"} className="mt-1">
                                    {displayJob.type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 font-medium text-ink">{displayJob.brandName}</td>
                                <td className="px-4 py-3 text-[#5A4A44] text-xs">
                                  {displayJob.productType}
                                  {(() => {
                                    const branding = (displayJob.brandProvides || []).filter((i) => i !== BRANDING_NONE);
                                    if (branding.length === 0) return null;
                                    return (
                                      <p
                                        className="mt-1 max-w-[160px] truncate text-[10px] font-semibold text-[#8A6A00]"
                                        title={branding.join(", ")}
                                      >
                                        {branding.join(", ")}
                                      </p>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-ink">{displayJob.artisanName}</p>
                                  <p className="text-xs text-[#A39289] truncate max-w-[120px]">{displayJob.artisanEmail}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-[#A39289]">
                                  {displayJob.deadline
                                    ? formatDate(displayJob.deadline)
                                    : displayJob.quoteTimeline
                                      ? <span title="Brand's requested timeline">{TIMELINE_LABEL[displayJob.quoteTimeline] || displayJob.quoteTimeline}</span>
                                      : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <PipelineStepper type={displayJob.type} currentStatus={displayJob.status} />
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={STATUS_VARIANT[displayJob.status] || "default"}>
                                    {displayJob.status?.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setViewJobs(group)}
                                    className="flex items-center gap-1.5 rounded-xl border border-[#E8DED5] bg-white px-3 py-1.5 text-xs font-semibold text-[#6A5B54] hover:bg-atmosphere transition-colors"
                                  >
                                    <Eye className="h-3 w-3" /> View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="border-t border-[#F4EFEA] px-4 py-2 text-xs text-[#A39289]">
                        Showing {groupedJobs.length} order{groupedJobs.length !== 1 ? "s" : ""} ({filteredJobs.length} jobs) of {activeJobs.length} total
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SAMPLE READY ── */}
            {activeTab === "review" && (
              <div className="space-y-3">
                {/* Jobs needing admin video review */}
                {(() => {
                  const totalVideoJobs = activeJobs.filter((j) =>
                    ["VIDEO_UPLOADED", "CORRECTION_REQUESTED", "SAMPLE_APPROVED"].includes(j.status)
                  ).length;
                  if (filteredVideoJobs.length === 0) return (
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#E8DED5] bg-white py-20 text-center shadow-xl">
                      <Video className="h-12 w-12 text-[#D7CBC1]" />
                      <p className="font-semibold text-ink">
                        {totalVideoJobs === 0 ? "No sample videos to review" : "No videos match the filters"}
                      </p>
                      <p className="text-sm text-[#A39289]">
                        {totalVideoJobs === 0
                          ? "Videos appear here when artisans upload them."
                          : "Try adjusting or clearing your filters."}
                      </p>
                    </div>
                  );
                  return (
                    <div className="overflow-hidden rounded-3xl border border-[#E8DED5] bg-white shadow-xl">
                      <div className="border-b border-[#F4EFEA] bg-atmosphere/40 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-wider text-[#A39289]">
                          Videos Needing Review ({filteredVideoJobs.length})
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#F4EFEA] bg-atmosphere/20">
                              {["Order Ref", "Brand", "Artisan", "Status", "Corrections", "Admin Review", "Actions"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-[#A39289]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F4EFEA]">
                            {filteredVideoJobs.map((job) => (
                              <tr key={job.id} className="hover:bg-atmosphere/20 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-mono text-xs font-bold text-leather">{job.orderRef}</p>
                                  {job.quoteRef && (
                                    <p className="font-mono text-[10px] text-[#A39289] mt-0.5">[{job.quoteRef}]</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-medium text-ink">{job.brandName}</td>
                                <td className="px-4 py-3 text-[#5A4A44]">{job.artisanName}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={STATUS_VARIANT[job.status] || "default"}>
                                    {job.status?.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-semibold text-[#5A4A44]">
                                  {job.correctionCount}/2
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    job.adminVideoStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : job.adminVideoStatus === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}>
                                    {job.adminVideoStatus === "APPROVED" ? "Approved"
                                      : job.adminVideoStatus === "REJECTED" ? "Rejected"
                                      : "Pending"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setViewJobs([job])}
                                    className="flex items-center gap-1.5 rounded-xl border border-[#E8DED5] bg-white px-3 py-1.5 text-xs font-semibold text-[#6A5B54] hover:bg-atmosphere transition-colors"
                                  >
                                    <Eye className="h-3 w-3" /> Review
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* ── ASSIGN ARTISAN MODAL ── */}
        <Modal
          title={
            selectedOrder?.jobs?.some((j) => ["DECLINED", "EXPIRED"].includes(j.status))
              ? `Re-assign ${assignType === "SAMPLE" ? "Sample" : "Production"} Job`
              : `Assign ${assignType === "SAMPLE" ? "Sample" : "Production"} Job`
          }
          open={assignModal}
          onClose={() => setAssignModal(false)}
        >
          {selectedOrder && (
            <div className="space-y-4">
              {/* Re-assignment notice — shown when previous artisans declined or expired */}
              {selectedOrder.jobs?.some((j) => ["DECLINED", "EXPIRED"].includes(j.status)) && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-orange-800">Re-assignment</p>
                  <p className="mt-0.5 text-orange-700 text-xs">
                    {selectedOrder.jobs
                      .filter((j) => ["DECLINED", "EXPIRED"].includes(j.status))
                      .map((j) => (
                        <span key={j.id} className="inline-flex items-center gap-1 mr-2">
                          <span className="font-medium">{j.artisan?.fullName || "Artisan"}</span>
                          <span className={`rounded-full px-1.5 py-0 text-[10px] font-bold ${j.status === "DECLINED" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                            {j.status === "DECLINED" ? "declined" : "offer expired"}
                          </span>
                        </span>
                      ))}
                  </p>
                </div>
              )}
              {/* Order summary */}
              <div className="rounded-xl border border-[#E8DED5] bg-atmosphere p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Order</p>
                    <p className="font-bold text-ink font-mono">
                      {selectedOrder.ref || `#${selectedOrder.id.slice(0, 8).toUpperCase()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Brand</p>
                    <p className="font-bold text-ink">{selectedOrder.brand?.businessName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Product</p>
                    <p className="font-medium text-ink">{selectedOrder.quote?.productType?.[0] || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#A39289] uppercase">Quantity</p>
                    <p className="font-medium text-ink">{selectedOrder.quote?.quantity || "—"}</p>
                  </div>
                </div>
                {selectedOrder.quote?.ref && (
                  <div className="mt-3 pt-3 border-t border-[#E8DED5]">
                    <p className="text-[10px] text-[#A39289] uppercase tracking-wide mb-0.5">Quote Reference</p>
                    <p className="font-mono text-xs font-bold text-leather">[{selectedOrder.quote.ref}]</p>
                  </div>
                )}
                {selectedOrder.quote?.brandProvides?.filter((i) => i !== BRANDING_NONE).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E8DED5]">
                    <p className="text-[10px] text-[#A39289] uppercase tracking-wide mb-1">Branding Requested</p>
                    <BrandingBadges items={selectedOrder.quote.brandProvides} />
                  </div>
                )}
              </div>

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
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#A39289] uppercase mb-1">Produces For</label>
                    <select
                      value={filterProducesFor}
                      onChange={(e) => { setFilterProducesFor(e.target.value); setSelectedArtisan(""); }}
                      className="w-full rounded-xl border border-[#E8DED5] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-leather/20 focus:border-leather bg-white"
                    >
                      <option value="">All Categories</option>
                      <option value="MALE">Male Wear</option>
                      <option value="FEMALE">Female Wear</option>
                      <option value="UNISEX">Unisex / Both</option>
                    </select>
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
                              {a.producesFor && (
                                <span className="rounded-full bg-atmosphere border border-[#E8DED5] px-2 py-0.5 text-[10px] font-bold text-leather">
                                  {PRODUCES_FOR_LABEL[a.producesFor] || a.producesFor}
                                </span>
                              )}
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
    );
}
