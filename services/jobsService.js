import apiClient from "./apiClient";

export async function getPendingSampleOrders() {
  const res = await apiClient.get("/admin/orders/pending-assignment");
  // Backend already filters to FLAT_FEE_PAID orders with no active jobs — no client-side filter needed
  return res.data.data || [];
}

export async function getPendingProductionOrders() {
  const res = await apiClient.get("/admin/orders/pending-production-assignment");
  return res.data.data || [];
}

export async function getAvailableArtisans(orderId = null) {
  // Pass orderId so backend can flag artisans who previously declined/expired for this order
  const params = orderId ? { params: { orderId } } : {};
  const res = await apiClient.get("/admin/artisans/available", params);
  return res.data.data || [];
}

export async function assignSampleJob({ orderId, artisanId, specifications, deadline }) {
  const res = await apiClient.post(
    `/admin/orders/${orderId}/assign`,
    { artisanId, specifications, deadline },
  );
  return res.data.data;
}

export async function assignProductionJob({ orderId, artisanId, specifications, deadline }) {
  const res = await apiClient.post(
    `/admin/orders/${orderId}/assign-production`,
    { artisanId, specifications, deadline },
  );
  return res.data.data;
}

export async function getSampleCompletedOrders() {
  const res = await apiClient.get("/admin/orders/sample-completed");
  return res.data.data || [];
}

export async function forwardSampleToBrand(orderId) {
  const res = await apiClient.post(`/admin/orders/${orderId}/forward-sample`, {});
  return res.data;
}

export async function getAllJobsFromOrders() {
  const res  = await apiClient.get("/admin/orders");
  const data = res.data.data || {};
  const allOrders = Array.isArray(data)
    ? data
    : [...(data.sample || []), ...(data.production || [])];

  const jobs = [];
  for (const order of allOrders) {
    for (const job of order.jobs || []) {
      const specs = Array.isArray(job.artisan?.specialty) ? job.artisan.specialty : (job.artisan?.specialty ? [job.artisan.specialty] : []);
      jobs.push({
        ...job,
        orderId:              order.id,
        orderRef:             order.ref || `#${order.id.slice(0, 8).toUpperCase()}`,
        orderType:            order.type,
        orderStatus:          order.status,
        brandName:            order.brand?.businessName || "—",
        productType:          job.productType || order.quote?.productType?.[0] || "—",
        quantity:             job.quantity || order.quote?.quantity || "—",
        artisanName:          job.artisan?.fullName || "—",
        artisanEmail:         job.artisan?.user?.email || "—",
        artisanSpecialty:     specs,
        artisanCapacity:      job.artisan?.capacityPerWeek || null,
        specifications:       job.specifications || "",
        quoteTimeline:        order.quote?.timeline || null,
        // flatFeePaid fallback (divide by 1.075) only valid for SAMPLE orders where totalAmount is VAT-inclusive.
        // For PRODUCTION orders, flatFeePaid is a foreign reference and totalAmount is pre-VAT — don't guess.
        flatFeePaid: order.flatFeePaid ||
          (order.type === "SAMPLE" ? Math.round((order.totalAmount ?? 0) / 1.075) : 0) || 0,
        brandPaidTotal:          order.totalAmount || 0,
        artisanBankDetail:       job.artisan?.bankDetail || null,
        artisanHasBankDetails:   !!job.artisan?.bankDetail?.accountNumber,
        hasVideo:                !!job.video?.url,
        videoUrl:                job.video?.url || null,
        correctionCount:         job.correctionCount ?? 0,
        correctionNote:          job.correctionNote ?? null,
        brandVideoVisible:       job.brandVideoVisible ?? false,
        adminVideoStatus:        job.adminVideoStatus || null,
        adminVideoNote:          job.adminVideoNote || null,
        samplePaymentReleased:   (order.payments || []).some(
          (p) => p.stage === "SAMPLE_FLAT_FEE" && p.status === "RELEASED"
        ),
        createdAt:               job.createdAt,
      });
    }
  }
  return jobs;
}

// ── New job pipeline actions (admin) ───────────────────────────────────────

/** Get full job detail including video + correction data */
export async function getAdminJobDetail(jobId) {
  const res = await apiClient.get(`/admin/jobs/${jobId}`);
  return res.data.data;
}

/** Get a 15-min presigned URL for a private S3 file */
export async function presignAdminFile(url) {
  const res = await apiClient.get("/admin/files/presign", { params: { url } });
  return res.data.signedUrl;
}

/** Admin approves sample video — sets brandVideoVisible = true, notifies brand */
export async function approveVideo(jobId) {
  const res = await apiClient.patch(`/admin/jobs/${jobId}/approve-video`, {});
  return res.data;
}

/** Admin rejects sample video with a reason — notifies artisan */
export async function rejectVideo(jobId, note) {
  const res = await apiClient.patch(`/admin/jobs/${jobId}/reject-video`, { note });
  return res.data;
}

/** Admin confirms sample is complete after brand approval — triggers production job */
export async function completeSample(jobId) {
  const res = await apiClient.patch(`/admin/jobs/${jobId}/complete-sample`, {});
  return res.data;
}

/** Admin marks production as dispatched */
export async function dispatchProduction(jobId) {
  const res = await apiClient.patch(`/admin/jobs/${jobId}/dispatch`, {});
  return res.data;
}

/**
 * Release 70% sample flat fee to artisan.
 * Admin retains 30% commission.
 */
export async function releaseSamplePayment(jobId) {
  const res = await apiClient.post(`/admin/jobs/${jobId}/release-sample-payment`, {});
  return res.data;
}

/** Admin confirms delivery of a production job */
export async function confirmDelivery(jobId) {
  const res = await apiClient.patch(`/admin/jobs/${jobId}/confirm-delivery`, {});
  return res.data;
}
