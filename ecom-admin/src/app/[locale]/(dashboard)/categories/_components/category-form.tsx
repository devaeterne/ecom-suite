"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Checkbox, Input, Label, Text } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { CategoriesApi, type Category } from "@/src/lib/api/product/categories";

type Props = {
  mode: "create" | "edit";
  categoryId?: string;
  initial?: Category;
  loading?: boolean;
};

export default function CategoryForm({
  mode,
  categoryId,
  initial,
  loading,
}: Props) {
  const t = useT();
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edit initial hydrate
  useEffect(() => {
    if (mode !== "edit") return;
    if (!initial) return;

    setName(initial.name ?? "");
    setHandle(initial.handle ?? "");
    setIsActive(initial.isActive ?? true);
  }, [mode, initial]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (saving) return false;
    return name.trim().length >= 2 && handle.trim().length >= 2;
  }, [name, handle, loading, saving]);

  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        handle: handle.trim(),
        isActive,
      };

      if (mode === "create") {
        await CategoriesApi.create(payload);
      } else {
        if (!categoryId) throw new Error("categoryId missing");
        await CategoriesApi.update(categoryId, payload);
      }

      router.push(`/${locale}/categories`);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message || t("categories.notifications.saveFailed") || "Save failed",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      {loading ? (
        <Text size="small" className="text-ui-fg-subtle">
          {t("categories.common.loading")}
        </Text>
      ) : null}

      {error ? (
        <Text size="small" className="text-ui-fg-error">
          {error}
        </Text>
      ) : null}

      <div className="space-y-2">
        <Label>{t("categories.fields.title")}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("categories.placeholders.title")}
        />
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("categories.hints.title")}
        </Text>
      </div>

      <div className="space-y-2">
        <Label>{t("categories.fields.handle")}</Label>
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={t("categories.placeholders.handle")}
        />
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("categories.hints.handle")}
        </Text>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          checked={isActive}
          onCheckedChange={(v) => setIsActive(!!v)}
        />
        <Text size="small">{t("categories.fields.active")}</Text>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSubmit} disabled={!canSubmit}>
          {saving ? t("categories.common.saving") : t("categories.common.save")}
        </Button>

        <Button
          variant="secondary"
          onClick={() => router.push(`/${locale}/categories`)}
          disabled={saving}
        >
          {t("categories.common.cancel")}
        </Button>
      </div>
    </div>
  );
}
