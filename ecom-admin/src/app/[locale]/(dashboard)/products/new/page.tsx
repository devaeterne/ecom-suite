"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useT } from "@/i18n/use-t";
import { toast } from "@medusajs/ui";
import { apiFetch } from "@/src/lib/api/_client/http";
import {
  slugify,
  useProductNewDraft,
} from "./_state/product-new-draft.provider";

type Category = { id: string; name: string };
type Tag = { id: string; name: string };

// ------------------------------------------------------------
// Meta cache (module-scope): TTL + inflight dedupe + boş cache’leme yok
// ------------------------------------------------------------
type MetaState = {
  categories: Category[];
  tags: Tag[];
  loadedAt: number;
  key: string;
};

let META_CACHE: MetaState | null = null;
let META_INFLIGHT: Promise<MetaState> | null = null;

const META_TTL_MS = 60_000; // 1 dk

function isFresh(meta: MetaState) {
  return Date.now() - meta.loadedAt < META_TTL_MS;
}

// Tenant / session değişkenleri burada temsil edilir (elinde varsa ekle).
// En azından version key: ileride contract değişince cache’i kırar.
function buildMetaKey() {
  return "meta:v1";
}

function pickItems<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];

  const candidates = [
    raw.items,
    raw.data,
    raw.categories,
    raw.tags,
    raw.results,
    raw.rows,
    raw?.result?.items,
    raw?.result?.data,
    raw?.data?.items,
    raw?.data?.categories,
    raw?.data?.tags,
    raw?.items?.items,
    raw?.pagination?.items,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
  }
  return [];
}

async function readApiError(
  e: any,
): Promise<{ status?: number; message: string; code?: string }> {
  const status = e?.status ?? e?.response?.status;
  const data = e?.data ?? e?.response?.data;

  if (!data && e?.response instanceof Response) {
    try {
      const json = await e.response.json();
      return {
        status: e.response.status,
        message:
          json?.message || json?.detail || json?.error || "Request failed",
        code: json?.code,
      };
    } catch {
      // ignore
    }
  }

  if (data && typeof data === "object") {
    const msg =
      data.message ||
      data.detail ||
      data.error ||
      (Array.isArray(data.errors) ? data.errors[0]?.message : null) ||
      "Request failed";

    return { status, message: String(msg), code: data.code };
  }

  return { status, message: e?.message ? String(e.message) : "Request failed" };
}

async function fetchMeta(force = false): Promise<MetaState> {
  const key = buildMetaKey();

  if (!force && META_CACHE && META_CACHE.key === key && isFresh(META_CACHE)) {
    return META_CACHE;
  }

  if (META_INFLIGHT) return META_INFLIGHT;

  META_INFLIGHT = (async () => {
    const [catsRaw, tagsRaw] = await Promise.all([
      apiFetch<any>("/api/admin/categories", {
        method: "GET",
        credentials: "include",
        // apiFetch forward ediyorsa:
        cache: "no-store",
      }),
      apiFetch<any>("/api/admin/tags", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    const categories = pickItems<Category>(catsRaw);
    const tags = pickItems<Tag>(tagsRaw);

    const next: MetaState = {
      categories,
      tags,
      loadedAt: Date.now(),
      key,
    };

    // ✅ boş geldiyse cache’leme (geçici auth/tenant glitch olabiliyor)
    if (categories.length || tags.length) {
      META_CACHE = next;
    }

    META_INFLIGHT = null;
    return next;
  })();

  return META_INFLIGHT;
}

function pickCreatedId(res: any): string | null {
  if (!res) return null;
  if (res.product?.id) return String(res.product.id);
  if (res.id) return String(res.id);
  return null;
}

export default function ProductNewDetailsPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  const {
    draftId,
    setDraftId,
    title,
    setTitle,
    handle,
    setHandle,
    handleTouched,
    setHandleTouched,
    status,
    setStatus,
    description,
    setDescription,
    categoryIds,
    setCategoryIds,
    tagIds,
    setTagIds,
    canDraft,
    draftBody,
  } = useProductNewDraft();

  const [saving, setSaving] = useState(false);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [metaError, setMetaError] = useState<string | null>(null);

  // title -> handle auto-fill (handle’a dokunulmadıysa)
  useEffect(() => {
    if (handleTouched) return;
    setHandle(slugify(title));
  }, [title, handleTouched, setHandle]);

  async function loadMeta(force = false) {
    setLoadingMeta(true);
    setMetaError(null);

    try {
      const meta = await fetchMeta(force);
      setCategories(meta.categories);
      setTags(meta.tags);
    } catch (e: any) {
      console.error("[ProductNewDetailsPage] meta load failed", e);
      const err = await readApiError(e);
      setCategories([]);
      setTags([]);
      setMetaError(err.message);
      toast.error(err.message || t("notifications.loadFailed"));
    } finally {
      setLoadingMeta(false);
    }
  }

  // StrictMode-safe preload
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;

      // önce cache’i bas (varsa)
      const key = buildMetaKey();
      if (META_CACHE && META_CACHE.key === key && isFresh(META_CACHE)) {
        setCategories(META_CACHE.categories);
        setTags(META_CACHE.tags);
        setLoadingMeta(false);
        return;
      }

      await loadMeta(false);
    })();

    return () => {
      alive = false;
    };
    // t değişince toast mesajları farklılaşabilir; ama meta için şart değil
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = useMemo(() => canDraft && !saving, [canDraft, saving]);

  async function onSaveDraft() {
    if (!canSave) return;

    // draft varsa şimdilik “saved”
    if (draftId) {
      toast.success(t("notifications.saved"));
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<any>("/api/admin/products", {
        method: "POST",
        credentials: "include",
        body: draftBody,
      });

      const id = pickCreatedId(res);
      if (!id) {
        toast.error(t("notifications.saveFailed"));
        return;
      }

      setDraftId(id);
      toast.success(t("notifications.saved"));

      router.push(`/${locale}/products/${id}`);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      const err = await readApiError(e);

      if (err.status === 409 || /unique|conflict|handle/i.test(err.message)) {
        toast.error(
          `Handle already exists: "${handle}". Please choose a different one.`,
        );
        return;
      }

      toast.error(err.message || t("notifications.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const label = "text-xs font-medium text-muted-foreground";
  const input =
    "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none";
  const textarea =
    "min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">
          {t("products.product_detail.tabs.details")}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadMeta(true)}
            disabled={loadingMeta}
            className="h-9 rounded-md border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh categories/tags"
          >
            {t("common.refresh")}
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={!canSave}
            className="h-9 rounded-md border px-3 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className={label}>
            {t("products.product_detail.fields.title")}
          </div>
          <input
            className={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className={label}>
            {t("products.product_detail.fields.handle")}
          </div>
          <input
            className={input}
            value={handle}
            onChange={(e) => {
              setHandleTouched(true);
              setHandle(e.target.value);
            }}
            placeholder="e.g. hp-compatible-toner"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {t("products.product_detail.hints.handleHelp")}
          </div>
        </div>

        <div>
          <div className={label}>
            {t("products.product_detail.fields.status")}
          </div>
          <select
            className={input}
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="draft">
              {t("products.product_detail.status.draft")}
            </option>
            <option value="published">
              {t("products.product_detail.status.published")}
            </option>
            <option value="archived">
              {t("products.product_detail.status.archived")}
            </option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className={label}>
            {t("products.product_detail.fields.description")}
          </div>
          <textarea
            className={textarea}
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* meta */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className={label}>
            {t("products.product_detail.fields.categories")}
          </div>

          <select
            multiple
            className="h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
            disabled={loadingMeta}
            value={categoryIds}
            onChange={(e) =>
              setCategoryIds(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="mt-1 text-xs text-muted-foreground">
            {t("products.product_detail.hints.multiSelect")}
          </div>

          {!loadingMeta && categories.length === 0 ? (
            <div className="mt-2 rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
              Categories boş geliyor.{" "}
              {metaError
                ? `Hata: ${metaError}`
                : "Response parse edilemiyor olabilir."}
            </div>
          ) : null}
        </div>

        <div>
          <div className={label}>
            {t("products.product_detail.fields.tags")}
          </div>

          <select
            multiple
            className="h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
            disabled={loadingMeta}
            value={tagIds}
            onChange={(e) =>
              setTagIds(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
          >
            {tags.map((tg) => (
              <option key={tg.id} value={tg.id}>
                {tg.name}
              </option>
            ))}
          </select>

          <div className="mt-1 text-xs text-muted-foreground">
            {t("products.product_detail.hints.multiSelect")}
          </div>

          {!loadingMeta && tags.length === 0 ? (
            <div className="mt-2 rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
              Tags boş geliyor.{" "}
              {metaError
                ? `Hata: ${metaError}`
                : "Response parse edilemiyor olabilir."}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
        {t("products.product_detail.hints.draftAutoCreate")}
      </div>
    </div>
  );
}
