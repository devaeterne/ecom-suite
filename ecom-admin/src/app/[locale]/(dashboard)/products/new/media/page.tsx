"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useT } from "@/i18n/use-t";
import { toast } from "@medusajs/ui";
import { apiFetch } from "@/src/lib/api/_client/http";
import { useProductNewDraft } from "../_state/product-new-draft.provider";

function pickCreatedId(res: any): string | null {
  if (!res) return null;
  if (res.product?.id) return String(res.product.id);
  if (res.id) return String(res.id);
  return null;
}

export default function ProductNewMediaPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  const baseNew = `/${locale}/products/new`;

  const { draftId, setDraftId, canDraft, draftBody } = useProductNewDraft();
  const [creating, setCreating] = useState(false);

  // ✅ Eğer draft oluşmuşsa, new/media'da durma -> edit media'ya git
  useEffect(() => {
    if (!draftId) return;
    router.replace(`/${locale}/products/${draftId}/media`);
    router.refresh();
  }, [draftId, locale, router]);

  async function createDraftAndGo() {
    if (creating) return;

    if (!canDraft) {
      toast.error(t("products.product_detail.hints.titleHandleRequired"));
      router.push(baseNew);
      return;
    }

    setCreating(true);
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

      router.push(`/${locale}/products/${id}/media`);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
      router.push(baseNew);
    } finally {
      setCreating(false);
    }
  }

  // draft varsa bu sayfa 1 an görünüp redirect olacak; küçük skeleton:
  if (draftId) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div className="text-sm font-medium">
        {t("products.product_detail.tabs.media")}
      </div>

      {/* Info */}
      <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
        <div className="font-medium text-foreground mb-1">
          {t("products.product_detail.hints.createFirstTitle")}
        </div>
        <div>{t("products.product_detail.hints.mediaAfterCreate")}</div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={baseNew}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted/40"
        >
          {t("products.product_detail.actions.goToDetails")}
        </Link>

        <button
          type="button"
          onClick={createDraftAndGo}
          disabled={creating}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted/40 disabled:opacity-50"
          title={
            !canDraft
              ? t("products.product_detail.hints.titleHandleRequired")
              : ""
          }
        >
          {creating
            ? t("common.saving")
            : t("products.product_detail.actions.createAndContinue")}
        </button>
      </div>
    </div>
  );
}
