// src/lib/api/products/admin.ts
import { apiFetch } from "@/src/lib/api/_client/http";
import { withQuery } from "@/src/lib/api/_client/query";
import type {
  AdminProductDetail,
  AdminProductListItem,
  AdminVariantListItem,
  AdminMediaItem,
  AdminTranslationItem,
  ProductStatus,
  InventoryStatus,
} from "@/src/modules/products/types/products.types";

// --- API DTO'lar (şimdilik gevşek) ---
type ApiProductListResponse = {
  items?: any[];
  data?: any[]; // bazı backendler data döner
  products?: any[]; // bazen products
  total?: number;
  count?: number;
};

type ListParams = {
  q?: string;
  status?: ProductStatus;
  limit?: number;
  offset?: number;
};
// UI’da tablo için gereken minimal normalize
function toInventoryStatus(v: any): InventoryStatus {
  // backend’in gerçek field’ına göre bunu sonra “net” hale getiririz
  const raw = String(v ?? "").toLowerCase();
  if (raw.includes("out")) return "out";
  if (raw.includes("low")) return "low";
  if (raw.includes("in")) return "in_stock";
  return "in_stock";
}

function toProductStatus(v: any): ProductStatus {
  const raw = String(v ?? "").toLowerCase();
  if (raw === "published") return "published";
  if (raw === "archived") return "archived";
  return "draft";
}

function pickArray(r: ApiProductListResponse): any[] {
  return r.items ?? r.data ?? r.products ?? [];
}
export type AdminProductListQuery = {
  q?: string;
  status?: "draft" | "published" | "archived";
  categoryId?: string;
  collectionId?: string;
  offset?: number;
  limit?: number;
};

export type AdminProductListResponse = {
  items: AdminProductListItem[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
};

export async function listProducts(query: AdminProductListQuery) {
  return apiFetch<AdminProductListResponse>(
    withQuery("/api/admin/products", query),
    { method: "GET" }
  );
}
// Backend shape bilinmediği için güvenli mapper
export function mapApiProductToListItem(p: any): AdminProductListItem {
  return {
    id: String(p?.id ?? ""),
    title: String(p?.title ?? p?.name ?? "Untitled"),
    handle: p?.handle ? String(p.handle) : undefined,
    status: toProductStatus(p?.status),
    thumbnailUrl:
      p?.thumbnailUrl ??
      p?.thumbnail_url ??
      p?.thumbnail ??
      p?.images?.[0]?.url ??
      undefined,
    variantsCount: Number(
      p?.variantsCount ??
        p?.variants_count ??
        (Array.isArray(p?.variants) ? p.variants.length : 0)
    ),
    inventoryStatus: toInventoryStatus(
      p?.inventoryStatus ??
        p?.inventory_status ??
        p?.inventory?.status ??
        p?.stockStatus
    ),
    updatedAt: String(
      p?.updatedAt ?? p?.updated_at ?? new Date().toISOString()
    ),
  };
}

export const AdminProductsApi = {
  async list(params: ListParams = {}) {
    const path = withQuery("/api/admin/products", params);
    const r = await apiFetch<ApiProductListResponse>(path);
    const arr = pickArray(r).map(mapApiProductToListItem);
    const total = Number(r.total ?? r.count ?? arr.length);
    return { items: arr, total };
  },

  async get(id: string) {
    const r = await apiFetch<any>(`/api/admin/products/${id}`);
    const out: AdminProductDetail = {
      id: String(r?.id ?? id),
      title: String(r?.title ?? r?.name ?? ""),
      subtitle: r?.subtitle ? String(r.subtitle) : undefined,
      status: toProductStatus(r?.status),
      createdAt: String(
        r?.createdAt ?? r?.created_at ?? new Date().toISOString()
      ),
      updatedAt: String(
        r?.updatedAt ?? r?.updated_at ?? new Date().toISOString()
      ),
    };
    return out;
  },

  async create(body: any) {
    return apiFetch<any>("/api/admin/products", { method: "POST", body });
  },

  async update(id: string, body: any) {
    return apiFetch<any>(`/api/admin/products/${id}`, {
      method: "PATCH",
      body,
    });
  },

  async remove(id: string) {
    return apiFetch<any>(`/api/admin/products/${id}`, { method: "DELETE" });
  },

  async publish(id: string) {
    return apiFetch<any>(`/api/admin/products/${id}/publish`, {
      method: "POST",
    });
  },

  async unpublish(id: string) {
    return apiFetch<any>(`/api/admin/products/${id}/unpublish`, {
      method: "POST",
    });
  },

  async listVariants(productId: string) {
    const r = await apiFetch<any>(`/api/admin/products/${productId}/variants`);
    const arr: any[] =
      r?.items ?? r?.data ?? r?.variants ?? (Array.isArray(r) ? r : []);
    const items: AdminVariantListItem[] = arr.map((v) => ({
      id: String(v?.id ?? ""),
      title: String(v?.title ?? "Variant"),
      sku: v?.sku ? String(v.sku) : undefined,
      price: v?.price ? String(v.price) : undefined,
      inventoryStatus: toInventoryStatus(
        v?.inventoryStatus ?? v?.inventory?.status
      ),
    }));
    return items;
  },

  async listMedia(productId: string) {
    const r = await apiFetch<any>(`/api/admin/products/${productId}/media`);
    const arr: any[] =
      r?.items ?? r?.data ?? r?.media ?? (Array.isArray(r) ? r : []);
    const items: AdminMediaItem[] = arr.map((m) => ({
      id: String(m?.id ?? ""),
      url: String(m?.url ?? ""),
      alt: m?.alt ? String(m.alt) : undefined,
    }));
    return items;
  },

  async listTranslations(productId: string) {
    const r = await apiFetch<any>(
      `/api/admin/products/${productId}/translations`
    );
    const arr: any[] =
      r?.items ?? r?.data ?? r?.translations ?? (Array.isArray(r) ? r : []);
    const items: AdminTranslationItem[] = arr.map((t) => ({
      locale: String(t?.locale ?? t?.localeCode ?? "en"),
      title: t?.title ? String(t.title) : undefined,
      subtitle: t?.subtitle ? String(t.subtitle) : undefined,
      description: t?.description ? String(t.description) : undefined,
    }));
    return items;
  },
};
