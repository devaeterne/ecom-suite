// src/lib/api/product/categories.ts
import { apiFetch } from "@/src/lib/api/_client/http";
import { withQuery } from "@/src/lib/api/_client/query";

export type Category = {
  id: string;
  name: string;
  handle: string;
  parentId: string | null;
  isActive?: boolean;
  productCount?: number; // ✅
};

type ListParams = {
  q?: string;
  view?: "flat" | "tree";
  isActive?: boolean;
  limit?: number;
  offset?: number;
};

function toCategory(c: any): Category {
  return {
    id: String(c?.id ?? ""),
    name: String(c?.name ?? c?.title ?? ""),
    handle: String(c?.handle ?? ""),
    parentId: c?.parentId ?? null,
    isActive: typeof c?.isActive === "boolean" ? c.isActive : undefined,
    productCount:
      typeof c?.productCount === "number"
        ? c.productCount
        : typeof c?._count?.products === "number"
          ? c._count.products
          : 0,
  };
}

export const CategoriesApi = {
  async list(params: ListParams = {}) {
    // isActive backend’de destekleniyorsa gönder; desteklenmiyorsa UI filtreleriz
    const path = withQuery("/api/admin/categories", params as any);
    const r = await apiFetch<any>(path, { method: "GET" });

    const items: any[] =
      r?.items ?? r?.data ?? r?.categories ?? (Array.isArray(r) ? r : []);

    const mapped = items.map(toCategory);

    // Eğer backend isActive filtrelemiyorsa (yine de güvenli)
    const filtered =
      typeof params.isActive === "boolean"
        ? mapped.filter((x) => !!x.isActive === params.isActive)
        : mapped;

    return { items: filtered };
  },

  async get(id: string) {
    const r = await apiFetch<any>(`/api/admin/categories/${id}`, {
      method: "GET",
    });
    const c = r?.category ?? r;
    return toCategory(c);
  },

  async create(body: {
    name: string;
    handle: string;
    parentId?: string | null;
    isActive?: boolean;
  }) {
    return apiFetch<any>("/api/admin/categories", { method: "POST", body });
  },

  async update(
    id: string,
    body: Partial<{
      name: string;
      handle: string;
      parentId: string | null;
      isActive: boolean;
    }>,
  ) {
    return apiFetch<any>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body,
    });
  },

  async remove(id: string) {
    return apiFetch<any>(`/api/admin/categories/${id}`, { method: "DELETE" });
  },
};
