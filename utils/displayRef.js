/**
 * displayRef — canonical way to show any Leddar entity's reference.
 *
 * Prefers the entity's stored `ref` field (e.g. "ORD-A3K8T2").
 * Falls back to a formatted ID excerpt for legacy/null records.
 *
 * Usage:
 *   displayRef(order)             → "ORD-A3K8T2"  or  "#3F2504E0"
 *   displayRef(job)               → "JOB-X7BT2Q"  or  "#1A2B3C4D"
 *   displayRef(payment, "PAY")    → "PAY-K2M9TV"  or  "PAY-1A2B3C4D"
 *
 * @param {Object}  entity  Any object with a `ref` and/or `id` field
 * @param {string}  [prefix] Prefix for the ID fallback (no dash)
 * @returns {string}
 */
export function displayRef(entity, prefix) {
  if (!entity) return "—";
  if (entity.ref) return entity.ref;
  const id = entity.id || "";
  if (!id) return "—";
  const short = id.slice(0, 8).toUpperCase();
  return prefix ? `${prefix}-${short}` : `#${short}`;
}
