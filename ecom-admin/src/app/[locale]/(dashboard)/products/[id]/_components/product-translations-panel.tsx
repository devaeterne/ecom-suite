"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Input, Select, Textarea, toast } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { apiFetch } from "@/src/lib/api/_client/http";

type TranslationFields = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  searchKeywords?: string | null;
};

type TranslationItem = {
  locale: string;
  fields: TranslationFields;
};

type TranslationsResponse = {
  // UI için desteklenen/aktif locale listesi
  locales: string[];
  // her locale’in alanları
  items: TranslationItem[];
};

const API = {
  // ✅ kendi endpoint’lerinle eşleştir
  getTranslations: (productId: string) =>
    apiFetch<TranslationsResponse>(`/api/admin/products/${productId}/translations`, {
      method: "GET",
    }),

  // ✅ upsert tek locale
  upsertLocale: (productId: string, locale: string, fields: TranslationFields) =>
    apiFetch(`/api/admin/products/${productId}/translations/${locale}`, {
      method: "PUT",
      body: fields,
    }),
};

function labelLocale(l: string) {
  if (l === "en") return "English (en)";
  if (l === "me") return "Montenegrin (me)";
  if (l === "tr") return "Türkçe (tr)";
  return l;
}

export function ProductTranslationsPanel() {
  const t = useT();
  const params = useParams<{ locale: string; id: string }>();

  const productId = params?.id ?? "";
  const uiLocale = params?.locale ?? "en"; // dashboard dili
  // editor locale'i ayrı yönetiyoruz
  const [activeLocale, setActiveLocale] = useState<string>("en");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [locales, setLocales] = useState<string[]>(["en"]);
  const [items, setItems] = useState<Record<string, TranslationFields>>({});
  const [dirty, setDirty] = useState(false);

  const active = useMemo(
    () => items[activeLocale] ?? {},
    [items, activeLocale],
  );

  useEffect(() => {
    if (!productId) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const res = await API.getTranslations(productId);

        if (!mounted) return;

        const locs = res.locales?.length ? res.locales : ["en"];
        setLocales(locs);

        const map: Record<string, TranslationFields> = {};
        for (const it of res.items ?? []) map[it.locale] = it.fields ?? {};
        for (const l of locs) map[l] = map[l] ?? {};
        setItems(map);

        // ✅ default: dashboard locale'i “en/me/tr” gibi destekleniyorsa onu aç
        const preferred = locs.includes(uiLocale) ? uiLocale : locs[0];
        setActiveLocale(preferred);

        setDirty(false);
      } catch (e: any) {
        toast.error(e?.message ?? "Translations load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [productId, uiLocale]);

  function patch(p: Partial<TranslationFields>) {
    setItems((prev) => ({
      ...prev,
      [activeLocale]: { ...(prev[activeLocale] ?? {}), ...p },
    }));
    setDirty(true);
  }

  async function onSave() {
    if (!productId) return;

    try {
      setSaving(true);
      await API.upsertLocale(productId, activeLocale, items[activeLocale] ?? {});
      toast.success(t("common.saved") || "Saved");
      setDirty(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!productId) return null;

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">
            {t("pages.product_detail.tabs.translations")}
          </div>

          <Select
            value={activeLocale}
            onValueChange={(v) => {
              setActiveLocale(String(v));
              setDirty(false);
            }}
          >
            <Select.Trigger className="w-[240px]">
              <Select.Value placeholder={t("common.select") || "Select"} />
            </Select.Trigger>
            <Select.Content>
              {locales.map((l) => (
                <Select.Item key={l} value={l}>
                  {labelLocale(l)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {dirty ? (
            <div className="text-xs text-muted-foreground">
              {t("common.unsaved_changes") || "Unsaved changes"}
            </div>
          ) : null}

          <Button
            variant="primary"
            onClick={onSave}
            disabled={loading || saving || !dirty}
          >
            {saving ? (t("common.saving") || "Saving...") : (t("common.save") || "Save")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-muted-foreground">
          {t("common.loading") || "Loading..."}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4">
          <Input
            placeholder={t("products.fields.title") || "Title"}
            value={active.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
          />

          <Input
            placeholder={t("products.fields.subtitle") || "Subtitle"}
            value={active.subtitle ?? ""}
            onChange={(e) => patch({ subtitle: e.target.value })}
          />

          <Textarea
            placeholder={t("products.fields.description") || "Description"}
            value={active.description ?? ""}
            onChange={(e) => patch({ description: e.target.value })}
            rows={8}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              placeholder={t("products.fields.seoTitle") || "SEO Title"}
              value={active.seoTitle ?? ""}
              onChange={(e) => patch({ seoTitle: e.target.value })}
            />
            <Input
              placeholder={t("products.fields.searchKeywords") || "Search Keywords"}
              value={active.searchKeywords ?? ""}
              onChange={(e) => patch({ searchKeywords: e.target.value })}
            />
          </div>

          <Textarea
            placeholder={t("products.fields.seoDescription") || "SEO Description"}
            value={active.seoDescription ?? ""}
            onChange={(e) => patch({ seoDescription: e.target.value })}
            rows={4}
          />
        </div>
      )}
    </div>
  );
}
