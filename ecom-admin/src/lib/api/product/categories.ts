export type Category = {
  id: string;
  title: string;
  handle: string;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListResponse = {
  items: Category[];
  total: number;
  limit?: number;
  offset?: number;
};

export type CategoryCreateInput = {
  title: string;
  handle: string;
  parentId?: string | null;
  isActive?: boolean;
};

export type CategoryUpdateInput = Partial<CategoryCreateInput>;

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // burada senin mevcut "passthrough" / "fetchJson" / "admin client" fonksiyonun varsa onu kullan
  const r = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Admin API error (${r.status}) ${text}`);
  }
  return (await r.json()) as T;
}

export const CategoriesApi = {
  list(params?: {
    q?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const usp = new URLSearchParams();
    if (params?.q) usp.set("q", params.q);
    if (typeof params?.isActive === "boolean")
      usp.set("isActive", String(params.isActive));
    if (typeof params?.limit === "number")
      usp.set("limit", String(params.limit));
    if (typeof params?.offset === "number")
      usp.set("offset", String(params.offset));

    const qs = usp.toString();
    return adminFetch<CategoryListResponse>(
      `/api/admin/categories${qs ? `?${qs}` : ""}`,
    );
  },

  get(id: string) {
    return adminFetch<Category>(`/api/admin/categories/${id}`);
  },

  create(input: CategoryCreateInput) {
    return adminFetch<Category>(`/api/admin/categories`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: CategoryUpdateInput) {
    return adminFetch<Category>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  remove(id: string) {
    return adminFetch<{ id: string }>(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
  },
};
