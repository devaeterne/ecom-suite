"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/src/lib/api/_client/http";
import { useT } from "@/i18n/use-t";

// Eğer lucide-react kullanıyorsan:
import { Eye, Pencil, Trash2 } from "lucide-react";

export function RowActionsMenu({ productId }: { productId: string }) {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  async function onDelete() {
    const ok = window.confirm(t("actions.confirm.deleteProduct"));
    if (!ok) return;

    try {
      await apiFetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      router.refresh();
    } catch (e) {
      alert(t("errors.productDeleteFailed"));
      console.error(e);
    }
  }

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted";

  return (
    <div className="inline-flex items-center gap-2">
      <div className="col-span-1 text-right pr-1">

        <Link
          href={`/${locale}/products/${productId}`}
          className={iconBtn}
          aria-label={t("actions.view")}
          title={t("actions.view")}
        >
          <Eye className="h-4 w-4" />
        </Link>

        <Link
          href={`/${locale}/products/${productId}/edit`}
          className={iconBtn}
          aria-label={t("actions.edit")}
          title={t("actions.edit")}
        >
          <Pencil className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={onDelete}
          className={`${iconBtn} text-red-600 hover:bg-red-50`}
          aria-label={t("actions.delete")}
          title={t("actions.delete")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
