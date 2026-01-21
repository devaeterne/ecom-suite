// src/lib/tenant/quota.ts
export function quotaMessage(input: {
  resource: "product" | "media";
  limit?: number;
  remaining?: number;
  status?: "draft" | "published" | "archived";
}) {
  const limit = Number(input.limit ?? 0) || 0;
  const remaining = Number(input.remaining ?? 0) || 0;

  if (limit <= 0) return null; // limit yok → mesaj yok

  if (input.resource === "product") {
    const st = input.status ? ` (${input.status})` : "";
    if (remaining <= 0) return `Plan limitine ulaşıldı${st}. Limit: ${limit}.`;
    return `Kalan hak${st}: ${remaining}/${limit}`;
  }

  if (input.resource === "media") {
    if (remaining <= 0)
      return `Bu ürün için görsel limiti dolu. Limit: ${limit}.`;
    return `Kalan görsel hakkı: ${remaining}/${limit}`;
  }

  return null;
}
