import apiClient from "./apiClient";

function shapeOrder(o) {
  return {
    id:            o.id,
    ref:           o.ref || null,
    quoteRef:      o.quote?.ref || null,
    orderType:     o.type === "SAMPLE" ? "Sample" : "Production",
    type:          o.type,
    status:        o.status,
    fullAmount:    o.totalAmount || 0,
    totalAmount:   o.totalAmount || 0,
    flatFeePaid:   o.flatFeePaid || 0,
    escrowBalance: o.escrowBalance || 0,
    brand:         o.brand?.businessName || "—",
    brandId:       o.brand?.id,
    brandEmail:    o.brand?.user?.email || "—",
    productType:   o.quote?.productType?.[0] || "—",
    quantity:      o.quote?.quantity || 0,
    price:         o.quote?.price || null,
    materials:     o.quote?.materials || null,
    labour:        o.quote?.labour || null,
    quoteId:       o.quoteId,
    jobs:          o.jobs || [],
    payments:      o.payments || [],
    statusLogs:    o.statusLogs || [],
    invoice:       o.invoice || null,
    createdAt:     o.createdAt,
  };
}

export async function getOrders() {
  try {
    const res  = await apiClient.get("/admin/orders");
    const data = res.data.data || {};
    const allOrders = Array.isArray(data)
      ? data
      : [...(data.sample || []), ...(data.production || [])];
    return allOrders.map(shapeOrder);
  } catch (err) {
    console.error("getOrders error:", err.message);
    return [];
  }
}

export async function getOrderById(id) {
  try {
    const res = await apiClient.get(`/admin/orders/${id}`);
    return shapeOrder(res.data.data);
  } catch (err) {
    console.error("getOrderById error:", err.message);
    return null;
  }
}

export async function getOrderTimeline(orderId) {
  try {
    const order = await getOrderById(orderId);
    return (order?.statusLogs || []).map((log) => ({
      status: log.status, note: log.note || "", at: log.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function updateOrderStatus({ orderId, nextStatus, note }) {
  const res = await apiClient.patch(
    `/admin/orders/${orderId}/status`,
    { status: nextStatus, note: note || "" },
  );
  return shapeOrder(res.data.data);
}

const SAMPLE_PIPELINE = [
  "SUBMITTED", "FLAT_FEE_PAID", "SAMPLE_IN_PROGRESS",
  "SAMPLE_COMPLETED", "SAMPLE_APPROVED", "BALANCE_PAID",
  "IN_PRODUCTION", "SHIPPED", "DELIVERED",
];
const PRODUCTION_PIPELINE = ["SUBMITTED", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

export async function getNextStatuses(orderId) {
  const order = await getOrderById(orderId);
  if (!order) return [];
  const pipeline = order.type === "SAMPLE" ? SAMPLE_PIPELINE : PRODUCTION_PIPELINE;
  const idx = pipeline.indexOf(order.status);
  if (idx === -1 || idx === pipeline.length - 1) return [];
  return [pipeline[idx + 1]];
}

export async function setProductionPricing({ orderId, price, materials, labour }) {
  const res = await apiClient.post(
    `/admin/orders/${orderId}/set-pricing`,
    { price: Number(price), materials: Number(materials), labour: Number(labour) },
  );
  return res.data;
}
