import apiClient from "./apiClient";

function shapeQuote(q) {
  return {
    id:            q.id,
    ref:           q.ref || null,
    brandName:     q.brand?.businessName || "—",
    brandEmail:    q.brand?.user?.email  || "—",
    brandWhatsapp: q.brand?.whatsapp     || null,
    brandId:       q.brand?.id           || null,
    requestType:   "Production Request",
    type:          q.type,
    productType:   q.productType?.[0] || "—",
    quantity:      q.quantity,
    timeline:      q.timeline,
    notes:         q.notes,
    files:         q.files  || [],
    status:        q.status,
    price:         q.price   || null,
    materials:     q.materials || null,
    labour:        q.labour    || null,
    orders:        q.orders    || [],
    date:          q.createdAt,
    createdAt:     q.createdAt,
  };
}

export async function getQuotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res   = await apiClient.get(`/admin/quotes${query ? `?${query}` : ""}`);
  return (res.data.data || []).map(shapeQuote);
}

export async function respondToQuote({ quoteId, price, materials, labour }) {
  const res = await apiClient.post(`/admin/quotes/${quoteId}/respond`, {
    price:     Number(price),
    materials: materials ? Number(materials) : undefined,
    labour:    labour    ? Number(labour)    : undefined,
  });
  return res.data;
}

export async function updateQuoteStatus(quoteId, status) {
  const res = await apiClient.patch(`/admin/quotes/${quoteId}/status`, { status });
  return res.data;
}

export async function getPresignedUrl(url) {
  const res = await apiClient.get(`/admin/files/presign`, { params: { url } });
  return res.data.signedUrl;
}
