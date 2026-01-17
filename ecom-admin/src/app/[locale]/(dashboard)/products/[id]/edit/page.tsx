"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/src/lib/api/_client/http";
import { useT } from "@/i18n/use-t";
import { toast } from "@medusajs/ui"

type Category = { id: string; name: string };
type Collection = { id: string; title?: string; name?: string };

type ProductOut = {
  id: string;
  title: string;
  handle: string;
  status: "draft" | "published" | "archived";
  description: string | null;
  categories?: Array<{ id: string; name: string }>;
  collections?: Array<{ id: string; title?: string; name?: string }>;
};

function pickProduct(pRes: any): ProductOut | null {
  if (!pRes) return null;
  if (pRes.product) return pRes.product as ProductOut;
  // bazı backend’ler direkt product döner
  if (pRes.id && pRes.title) return pRes as ProductOut;
  return null;
}

export default function ProductEditDetailsPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [product, setProduct] = useState<ProductOut | null>(null);

  // edit state
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [description, setDescription] = useState<string>("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  const canSave = useMemo(() => {
    if (!product) return false;

    const baseValid = title.trim().length >= 2 && handle.trim().length >= 2;
    if (!baseValid) return false;

    const prevCategoryIds = (product.categories ?? []).map((c) => c.id);
    const prevCollectionIds = (product.collections ?? []).map((c) => c.id);

    return (
      title !== product.title ||
      handle !== product.handle ||
      status !== product.status ||
      (description || null) !== (product.description || null) ||
      categoryIds.join(",") !== prevCategoryIds.join(",") ||
      collectionIds.join(",") !== prevCollectionIds.join(",")
    );
  }, [product, title, handle, status, description, categoryIds, collectionIds]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!id) return;
      setLoading(true);

      try {
        const [pResRaw, catsRaw, colsRaw] = await Promise.all([
          apiFetch<any>(`/api/admin/products/${id}`, {
            method: "GET",
            credentials: "include",
          }),
          apiFetch<{ items?: Category[] } | Category[]>("/api/admin/categories", {
            method: "GET",
            credentials: "include",
          }),
          apiFetch<{ items?: Collection[] } | Collection[]>("/api/admin/collections", {
            method: "GET",
            credentials: "include",
          }),
        ]);

        if (!alive) return;

        const p = pickProduct(pResRaw);
        setProduct(p);

        if (p) {
          setTitle(p.title ?? "");
          setHandle(p.handle ?? "");
          setStatus((p.status ?? "draft") as any);
          setDescription(p.description ?? "");

          // preselect
          setCategoryIds((p.categories ?? []).map((x) => x.id));
          setCollectionIds((p.collections ?? []).map((x) => x.id));
        }

        const catItems = Array.isArray(catsRaw) ? catsRaw : catsRaw.items ?? [];
        const colItems = Array.isArray(colsRaw) ? colsRaw : colsRaw.items ?? [];

        setCategories(catItems);
        setCollections(colItems);
      } catch (e) {
        // sessiz bırak (page zaten not found vs gösterecek)
        console.error("[ProductEditDetailsPage] load failed", e);
        if (!alive) return;
        setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave() {
    if (!id) return;

    setSaving(true);
    try {
      await apiFetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        body: {
          title,
          handle,
          status,
          description: description?.trim() ? description : null,
          categoryIds,
          collectionIds,
        },
      });

      // hafif UX: state'i "kaydetti" kabul edelim
      setProduct((p) =>
        p
          ? {
            ...p,
            title,
            handle,
            status,
            description: description?.trim() ? description : null,
            categories: categories
              .filter((c) => categoryIds.includes(c.id))
              .map((c) => ({ id: c.id, name: c.name })),
            collections: collections
              .filter((c) => collectionIds.includes(c.id))
              .map((c) => ({ id: c.id, title: c.title, name: c.name })),
          }
          : p
      );

      toast.success(t("notifications.saved"));
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
    } finally {
      setSaving(false);
    }
  }


  const box = "rounded-xl border p-4";
  const label = "text-xs font-medium text-muted-foreground";
  const input = "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none";
  const textarea =
    "min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none";

  if (loading) {
    return (
      <div className={box}>
        <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={box}>
        <div className="text-sm text-muted-foreground">{t("errors.productNotFound")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={box}>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{t("pages.product_detail.mode.edit")}</div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave || saving}
              className="h-9 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className={label}>{t("pages.product_detail.fields.title")}</div>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <div className={label}>{t("pages.product_detail.fields.handle")}</div>
            <input className={input} value={handle} onChange={(e) => setHandle(e.target.value)} />
          </div>

          <div>
            <div className={label}>{t("pages.product_detail.fields.status")}</div>
            <select className={input} value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="draft">{t("pages.product_detail.status.draft")}</option>
              <option value="published">{t("pages.product_detail.status.published")}</option>
              <option value="archived">{t("pages.product_detail.status.archived")}</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className={label}>{t("pages.product_detail.fields.description")}</div>
            <textarea
              className={textarea}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={box}>
        <div className="text-sm font-medium">{t("pages.product_detail.sections.organize")}</div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className={label}>{t("pages.product_detail.fields.categories")}</div>
            <select
              multiple
              className="h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={categoryIds}
              onChange={(e) => {
                const next = Array.from(e.target.selectedOptions).map((o) => o.value);
                setCategoryIds(next);
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="mt-1 text-xs text-muted-foreground">
              {t("pages.product_detail.hints.multiSelect")}
            </div>
          </div>

          <div>
            <div className={label}>{t("pages.product_detail.fields.collections")}</div>
            <select
              multiple
              className="h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={collectionIds}
              onChange={(e) => {
                const next = Array.from(e.target.selectedOptions).map((o) => o.value);
                setCollectionIds(next);
              }}
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title ?? c.name ?? c.id}
                </option>
              ))}
            </select>

            <div className="mt-1 text-xs text-muted-foreground">
              {t("pages.product_detail.hints.multiSelect")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
