import apiClient from "./apiClient";

const VAT_RATE = 0.075; // Fixed 7.5% — not configurable

function normalizeSettings(raw) {
  return {
    id:                     raw.id,
    // Production
    adminRate:              Math.round((raw.adminRate         ?? 0.15) * 100), // %
    artisanStage1Rate:      Math.round((raw.artisanStage1Rate ?? 0.40) * 100),
    artisanStage2Rate:      Math.round((raw.artisanStage2Rate ?? 0.45) * 100),
    // Sample
    sampleAdminRate:        Math.round((raw.sampleAdminRate   ?? 0.30) * 100),
    // Acceptance windows (hours — no conversion, stored as integers)
    sampleAcceptanceHours:     raw.sampleAcceptanceHours     ?? 24,
    productionAcceptanceHours: raw.productionAcceptanceHours ?? 48,
  };
}

export async function getCommissionSettings() {
  try {
    const res = await apiClient.get("/admin/commission-settings");
    return normalizeSettings(res.data.data);
  } catch {
    return {
      adminRate:         15,
      artisanStage1Rate: 40,
      artisanStage2Rate: 45,
      sampleAdminRate:   30,
    };
  }
}

// Requires OTP confirmation — call once without `otp` to trigger the email,
// then again with the code the admin enters. Returns { requiresOtp: true } on
// the first call, or { requiresOtp: false, data } once confirmed.
export async function updateCommissionSettings(payload, otp) {
  const body = {
    adminRate:                 payload.adminRate         / 100,
    artisanStage1Rate:         payload.artisanStage1Rate / 100,
    artisanStage2Rate:         payload.artisanStage2Rate / 100,
    sampleAdminRate:           payload.sampleAdminRate   / 100,
    // Hours — no conversion needed
    sampleAcceptanceHours:     Number(payload.sampleAcceptanceHours),
    productionAcceptanceHours: Number(payload.productionAcceptanceHours),
    ...(otp ? { otp } : {}),
  };
  const res = await apiClient.patch("/admin/commission-settings", body);
  if (res.data.requiresOtp) {
    return { requiresOtp: true, message: res.data.message };
  }
  return { requiresOtp: false, message: res.data.message, data: normalizeSettings(res.data.data) };
}

// ── Sample Pricing ─────────────────────────────────────────────────────────────

export async function getSamplePricingSettings() {
  try {
    const res = await apiClient.get("/admin/sample-pricing");
    return res.data.data.rows; // [{ id, productType, price }, ...]
  } catch {
    return [];
  }
}

// Requires OTP confirmation — call once without `otp` to trigger the email,
// then again with the code the admin enters. Returns { requiresOtp: true } on
// the first call, or { requiresOtp: false, data } once confirmed.
export async function updateSamplePricingSettings(rows, otp) {
  const res = await apiClient.patch("/admin/sample-pricing", { prices: rows, ...(otp ? { otp } : {}) });
  if (res.data.requiresOtp) {
    return { requiresOtp: true, message: res.data.message };
  }
  return { requiresOtp: false, message: res.data.message, data: res.data.data };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export { VAT_RATE };

/**
 * Break down a payment amount into admin / artisan portions.
 * settings values are already normalised to % integers (e.g. 15, 40, 45, 30).
 *
 * Returns: { adminCommission, adminPercent, stage1Amount, stage1Percent, stage2Amount, stage2Percent }
 */
export function calculateCommissionBreakdown(amount, type, settings) {
  if (!amount || !settings) return null;

  if (type === 'SAMPLE') {
    const adminPct   = settings.sampleAdminRate ?? 30;
    const artisanPct = 100 - adminPct;
    return {
      adminCommission: Math.round(amount * adminPct   / 100),
      adminPercent:    adminPct,
      stage1Amount:    Math.round(amount * artisanPct / 100),
      stage1Percent:   artisanPct,
      stage2Amount:    0,
      stage2Percent:   0,
    };
  }

  // PRODUCTION
  const adminPct = settings.adminRate         ?? 15;
  const s1Pct    = settings.artisanStage1Rate ?? 40;
  const s2Pct    = settings.artisanStage2Rate ?? 45;
  return {
    adminCommission: Math.round(amount * adminPct / 100),
    adminPercent:    adminPct,
    stage1Amount:    Math.round(amount * s1Pct   / 100),
    stage1Percent:   s1Pct,
    stage2Amount:    Math.round(amount * s2Pct   / 100),
    stage2Percent:   s2Pct,
  };
}

/**
 * Amount brand pays on sample order: samplePrice × 1.075
 */
export function sampleBrandTotal(samplePrice) {
  return Math.round(samplePrice * (1 + VAT_RATE));
}

/**
 * Amount brand pays on production order: (productionTotal - samplePrice) × 1.075
 */
export function productionBrandTotal(productionTotal, samplePrice) {
  return Math.round((productionTotal - samplePrice) * (1 + VAT_RATE));
}
