"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { apiFetch, HttpError } from "@/src/lib/api/_client/http";
import { ProductMediaPanel } from "@/src/app/[locale]/(dashboard)/products/_components/product-media-panel";

type ApiMediaItem = {
  id: string;
  fileId: string;
  url?: string;
  alt?: string | null;
  role?: string;
  rank?: number | null;
};

type ListMediaResponse = ApiMediaItem[] | { items: ApiMediaItem[] };

type PresignGetBody = {
  fileId: string;
  url: string;
  expiresAt?: string;
};

// -----------------------
// helpers
// -----------------------
function pickItems<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw.items)) return raw.items as T[];
  return [];
}

// -----------------------
// presign cache (module-ish: component scope ref)
// -----------------------
type CacheEntry = { url: string; loadedAt: number; expiresAt?: string };
const PRESIGN_TTL_MS = 4 * 60_000; // 4 dk (expire’a yakın yeniler)

export default function ProductMediaPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const productId = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<ApiMediaItem[]>([]);

  // t değişse bile load’u değiştirmeyelim diye: toast mesajlarını ref’te tutuyoruz
  const msgRef = useRef({
    unauthorized: "Unauthorized",
    loadFailed: "Load failed",
    loading: "Loading",
  });

  useEffect(() => {
    msgRef.current = {
      unauthorized: t("errors.unauthorized") || "Unauthorized",
      loadFailed: t("notifications.loadFailed") || "Load failed",
      loading: t("common.loading") || "Loading",
    };
  }, [t]);

  const abortRef = useRef<AbortController | null>(null);

  // presign cache + inflight
  const presignCacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const presignInflightRef = useRef<Map<string, Promise<string>>>(new Map());

  const presignGetUrl = useCallback(async (fileId: string) => {
    const now = Date.now();
    const cache = presignCacheRef.current;
    const inflight = presignInflightRef.current;

    const hit = cache.get(fileId);
    if (hit && now - hit.loadedAt < PRESIGN_TTL_MS) return hit.url;

    const inF = inflight.get(fileId);
    if (inF) return inF;

    const p = (async () => {
      const r = await apiFetch<PresignGetBody>(
        `/api/admin/files/${fileId}/presign-get`,
        {
          method: "GET",
          auth: "admin",
        } as any,
      );

      cache.set(fileId, {
        url: r.url,
        loadedAt: Date.now(),
        expiresAt: r.expiresAt,
      });
      return r.url;
    })().finally(() => {
      inflight.delete(fileId);
    });

    inflight.set(fileId, p);
    return p;
  }, []);

  const hydrateMediaUrls = useCallback(
    async (items: ApiMediaItem[]) => {
      // url yoksa doldur
      const out = await Promise.all(
        items.map(async (m) => {
          if (m.url) return m;
          if (!m.fileId) return m;
          const url = await presignGetUrl(m.fileId);
          return { ...m, url };
        }),
      );
      return out;
    },
    [presignGetUrl],
  );

  // 🔥 Kritik: load sadece productId’ye bağlı (t yok, media yok)
  const load = useCallback(async () => {
    if (!productId) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await apiFetch<ListMediaResponse>(
        `/api/admin/products/${productId}/media`,
        {
          method: "GET",
          auth: "admin",
          signal: abortRef.current.signal,
        } as any,
      );

      const items = pickItems<ApiMediaItem>(res);

      // UI stabilize: sadece fileId’leri değiştiyse hydrate et (aynıysa yeniden yazma)
      const sig = items
        .map((x) => `${x.id}:${x.fileId}:${x.role ?? ""}:${x.rank ?? ""}`)
        .join("|");
      const prevSig = mediaSigRef.current;

      if (sig === prevSig) {
        // aynı veri: setState yapma -> render loop riskini azaltır
        return;
      }

      const hydrated = await hydrateMediaUrls(items);

      mediaSigRef.current = sig;
      setMedia(hydrated);
    } catch (e: any) {
      if (e?.name === "AbortError") return;

      console.error(e);

      if (e instanceof HttpError && e.status === 401) {
        toast.error(msgRef.current.unauthorized);
      } else {
        toast.error(msgRef.current.loadFailed);
      }

      mediaSigRef.current = "";
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [productId, hydrateMediaUrls]);

  const mediaSigRef = useRef<string>("");

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const hero = useMemo(
    () =>
      media.find((m) => String(m.role ?? "").toUpperCase() === "HERO") ?? null,
    [media],
  );

  return (
    <div className="rounded-xl border p-4">
      {loading ? (
        <div className="text-sm text-muted-foreground">
          {msgRef.current.loading}
        </div>
      ) : (
        <ProductMediaPanel
          productId={productId}
          media={media}
          heroMediaId={hero?.id ?? null}
          onChanged={load} // upload/delete sonrası tek sefer reload
        />
      )}
    </div>
  );
}
