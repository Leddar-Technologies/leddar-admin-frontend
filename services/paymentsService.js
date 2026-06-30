import apiClient from "./apiClient";

function getEscrowStatus(order) {
  const s1 = order.payments?.some((p) => p.stage === "MATERIAL" && p.status === "RELEASED");
  const s2 = order.payments?.some((p) => p.stage === "SERVICE"  && p.status === "RELEASED");
  if (s1 && s2) return "Released";
  if (s1 || s2) return "Partially Released";
  if (order.escrowBalance > 0) return "Held";
  return "Pending";
}

export async function getPayments() {
  try {
    const res  = await apiClient.get("/admin/payments/escrow");
    const raw  = res.data.data || {};
    const list = Array.isArray(raw)
      ? raw
      : [...(raw.sample || []), ...(raw.production || [])];
    return list.map((item) => {
      const artisanObj   = item.jobs?.[0]?.artisan || null;
      const bankDetail   = artisanObj?.bankDetail || null;
      return {
        id:                   item.id,
        orderId:              item.id,
        orderRef:             item.ref || item.id?.slice(0, 8).toUpperCase(),
        quoteRef:             item.quote?.ref || null,
        brand:                item.brand?.businessName || "—",
        brandId:              item.brand?.id,
        artisan:              artisanObj?.fullName || "—",
        artisanId:            artisanObj?.id || null,
        artisanBankDetail:    bankDetail,
        artisanHasBankDetails: !!(bankDetail?.accountNumber && bankDetail?.bankCode),
        jobStatus:            item.jobs?.[0]?.status || null,
        fullAmount:           item.totalAmount || 0,
        escrowBalance:        item.escrowBalance || 0,
        type:                 item.type,
        status:               item.status,
        stage1Released:       item.payments?.some((p) => p.stage === "MATERIAL" && p.status === "RELEASED"),
        stage2Released:       item.payments?.some((p) => p.stage === "SERVICE"  && p.status === "RELEASED"),
        escrowStatus:         getEscrowStatus(item),
        invoiceStatus:        item.invoice?.isPaid ? "Paid" : "Pending",
        invoiceId:            item.invoice?.id,
        payments:             item.payments || [],
        // Snapshotted commission rates saved at order creation — use these for breakdown display
        snapshotAdminRate:    item.snapshotAdminRate    ?? null,
        snapshotStage1Rate:   item.snapshotStage1Rate   ?? null,
        snapshotStage2Rate:   item.snapshotStage2Rate   ?? null,
        snapshotSampleAdminRate: item.snapshotSampleAdminRate ?? null,
      };
    });
  } catch (err) {
    console.error("getPayments error:", err.message);
    return [];
  }
}

export async function markInvoicePaid(invoiceId) {
  const res = await apiClient.patch(`/admin/invoices/${invoiceId}/mark-paid`, {});
  return res.data;
}

export async function releaseStage(orderId, stage) {
  const endpoint = stage === 1
    ? `/admin/orders/${orderId}/release-stage1`
    : `/admin/orders/${orderId}/release-stage2`;
  const res = await apiClient.post(endpoint, {});
  return res.data;
}

export async function getBrandPaymentHistory(brandId) {
  const res = await apiClient.get(`/admin/brands/${brandId}/payments`);
  return res.data.data || [];
}

export async function getArtisanPaymentHistory(artisanId) {
  const res = await apiClient.get(`/admin/artisans/${artisanId}/payments`);
  return res.data.data || [];
}

export async function getSamplePayments() {
  try {
    const res = await apiClient.get("/admin/payments/sample-history");
    return res.data.data || [];
  } catch (err) {
    console.error("getSamplePayments error:", err.message);
    return [];
  }
}

export async function getArtisanPayoutHistory() {
  try {
    const res = await apiClient.get("/admin/payments/artisan-history");
    return res.data.data || [];
  } catch (err) {
    console.error("getArtisanPayoutHistory error:", err.message);
    return [];
  }
}

export async function getVatSummary() {
  try {
    const res = await apiClient.get("/admin/payments/vat-summary");
    return res.data.data || { summary: {}, records: [] };
  } catch (err) {
    console.error("getVatSummary error:", err.message);
    return { summary: {}, records: [] };
  }
}

export async function generateInvoice(orderId) {
  const res = await apiClient.get(`/admin/orders/${orderId}/invoice`, {
    responseType: "blob",
  });
  return res.data;
}

export async function downloadArtisanReceipt(paymentId) {
  const res = await apiClient.get(`/admin/payments/${paymentId}/artisan-receipt`, {
    responseType: "blob",
  });
  return res.data;
}

// ── FIRS Remittance ─────────────────────────────────────────────────────────

export async function getFIRSRemittances() {
  try {
    const res = await apiClient.get("/admin/firs-remittances");
    return res.data.data || [];
  } catch (err) {
    console.error("getFIRSRemittances error:", err.message);
    return [];
  }
}

export async function createFIRSRemittance({ amount, note }) {
  const res = await apiClient.post("/admin/firs-remittances", { amount, note });
  return res.data.data;
}

// ── Admin Earnings & Payouts ─────────────────────────────────────────────────

export async function getAdminEarnings() {
  try {
    const res = await apiClient.get("/admin/earnings");
    return res.data.data;
  } catch (err) {
    console.error("getAdminEarnings error:", err.message);
    return { totalEarned: 0, totalWithdrawn: 0, outstanding: 0, payoutCount: 0, payouts: [] };
  }
}

export async function createAdminPayout({ amount, note }) {
  const res = await apiClient.post("/admin/payout", { amount, note });
  return res.data;
}

export async function getAdminPayouts() {
  try {
    const res = await apiClient.get("/admin/payouts");
    return res.data.data || [];
  } catch (err) {
    console.error("getAdminPayouts error:", err.message);
    return [];
  }
}

export async function finalizeAdminPayout({ payoutId, otp }) {
  const res = await apiClient.post("/admin/payout/finalize", { payoutId, otp });
  return res.data;
}
