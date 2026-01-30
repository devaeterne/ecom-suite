"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "@medusajs/ui";
import { apiFetch } from "@/src/lib/api/_client/http";

type TranslationItem = {
  locale: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  searchKeywords?: string | null;
};

export function ProductTranslationsPanel() {
  const params = useParams<{ locale: string; id: string }>();
  const productId = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TranslationItem[]>([]); // ✅ default empty array
  const [activeLocale, setActiveLocale] = useState("en");

  useEffect(() => {
    if (!productId) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        // ✅ burayı kendi endpoint'inle eşleştir
        const res: any = await apiFetch(`/api/admin/products/${productId}/translations`, {
          method: "GET",
        });

        // ✅ normalize: res.items yoksa boş dizi
        const list: TranslationItem[] =
          (res?.items as TranslationItem[]) ??
          (res?.data?.items as TranslationItem[]) ??
          [];

        if (!mounted) return;

        setItems(list);

        // locale default
        const preferred = list.find((x) => x.locale === "en")?.locale ?? list[0]?.locale ?? "en";
        setActiveLocale(preferred);
      } catch (e: any) {
        toast.error(e?.message ?? "Translations load failed");
        if (mounted) setItems([]); // ✅ fail-safe
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [productId]);

  if (!productId) return null;

  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm font-medium">Translations</div>

      <div className="mt-3">
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={activeLocale}
          onChange={(e) => setActiveLocale(e.target.value)}
          disabled={loading}
        >
          {(items ?? []).map((i) => (
            <option key={i.locale} value={i.locale}>
              {i.locale.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-3 text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground">
          No translations found.
        </div>
      ) : null}
    </div>
  );
}
