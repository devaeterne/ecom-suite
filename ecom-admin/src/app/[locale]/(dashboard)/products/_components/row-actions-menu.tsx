"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, HttpError } from "@/src/lib/api/_client/http";
import { useT } from "@/i18n/use-t";
import { Eye, Pencil, Trash2 } from "lucide-react";

// varsa: delete sonrası quota UI anında güncellensin
import { useTenantEntitlements } from "@/src/lib/api/tenant/use-tenant-entitlements";

function readErr(e: any): { status?: number; code?: string; message: string } {
  if (e instanceof HttpError) {
    const data: any = (e as any).data;
    return {
      status: e.status,
      code: data?.code,
      message:
        data?.message ||
        data?.detail ||
        data?.error ||
        `Request failed (${e.status})`,
    };
  }
  return { message: e?.message ? String(e.message) : "Request failed" };
}

export function RowActionsMenu({
  productId,
  onDeleted,
}: {
  productId: string;
  onDeleted?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const [busy, setBusy] = useState(false);

  // hook’un içinde refresh yoksa bile sorun değil (try/catch no-op)
  const ent = useTenantEntitlements?.();

  async function onDelete() {
    if (busy) return;

    const ok = window.confirm(t("actions.confirm.deleteProduct"));
    if (!ok) return;

    setBusy(true);
    try {
      await apiFetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        auth: "admin",
        credentials: "include",
      });

      // ✅ anında listeden düşür
      onDeleted?.();

      // ✅ quota/usage UI’ı anında toparla (hook destekliyorsa)
      try {
        await (ent as any)?.refresh?.();
      } catch {
        // ignore
      }

      // opsiyonel: server state ile sync
      router.refresh();
    } catch (e: any) {
      console.error(e);
      const err = readErr(e);

      // daha net mesaj
      if (err.status === 404) {
        alert(t("errors.notFound"));
        return;
      }

      alert(err.message || t("errors.productDeleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-50";

  return (
    <div className="inline-flex items-center gap-2">
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
        disabled={busy}
        className={`${iconBtn} text-red-600 hover:bg-red-50`}
        aria-label={t("actions.delete")}
        title={t("actions.delete")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
