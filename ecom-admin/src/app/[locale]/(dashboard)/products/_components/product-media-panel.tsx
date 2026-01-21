"use client";

import { useRef, useState } from "react";
import { useT } from "@/i18n/use-t";
import { toast } from "@medusajs/ui";
import { apiFetch } from "@/src/lib/api/_client/http";

type ApiMediaItem = {
  id: string;
  url: string;
  alt?: string | null;
  role?: string;
  order?: number | null;
};

type Props = {
  productId: string;
  media: ApiMediaItem[];
  heroMediaId: string | null;
  onChanged: () => void;
};

type PresignPutBody = { fileId: string; putUrl: string };
type CompleteBody = { fileId: string; url?: string };

function normRole(v?: string) {
  return String(v ?? "GALLERY").toUpperCase();
}

function ensureFileOk(file: File) {
  const name = String(file?.name ?? "").trim();
  const size = Number(file?.size ?? 0);
  const type = String(file?.type ?? "").trim();

  if (!name) return { ok: false, message: "filename is empty" };
  if (!Number.isFinite(size) || size <= 0)
    return { ok: false, message: "size invalid" };

  // Backend contentType istiyor -> her zaman dolu gönderiyoruz
  const contentType = type || "application/octet-stream";

  return { ok: true, name, size, contentType };
}

// ------------------------------------------------------------
// API adapters (backend contract)
// ------------------------------------------------------------
async function presignPut(file: File) {
  const g = ensureFileOk(file);
  if (!g.ok) throw new Error(g.message);

  return apiFetch<PresignPutBody>("/api/admin/files/presign-put", {
    method: "POST",
    auth: "admin",
    body: {
      filename: g.name,
      contentType: g.contentType,
      size: Math.max(1, g.size | 0),
    },
  });
}

async function completeFile(fileId: string) {
  return apiFetch<CompleteBody>(`/api/admin/files/${fileId}/complete`, {
    method: "POST",
    auth: "admin",
  });
}

async function attachToProduct(productId: string, fileId: string) {
  return apiFetch(`/api/admin/products/${productId}/media`, {
    method: "POST",
    auth: "admin",
    body: { fileId, role: "GALLERY" },
  });
}

async function setHero(productId: string, mediaId: string) {
  return apiFetch(`/api/admin/products/${productId}/media/${mediaId}`, {
    method: "PATCH",
    auth: "admin",
    body: { role: "HERO" },
  });
}

async function removeMedia(productId: string, mediaId: string) {
  return apiFetch(`/api/admin/products/${productId}/media/${mediaId}`, {
    method: "DELETE",
    auth: "admin",
  });
}

// ------------------------------------------------------------
// UI
// ------------------------------------------------------------
export function ProductMediaPanel({
  productId,
  media,
  heroMediaId,
  onChanged,
}: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState(false);
  const [opId, setOpId] = useState<string | null>(null);

  async function uploadOne(file: File) {
    const { fileId, putUrl } = await presignPut(file);

    const contentType =
      String(file.type || "application/octet-stream").trim() ||
      "application/octet-stream";

    const putRes = await fetch(putUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });

    if (!putRes.ok) {
      throw new Error(`PUT failed (${putRes.status})`);
    }

    await completeFile(fileId);
    await attachToProduct(productId, fileId);
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (busy) return;

    setBusy(true);
    setOpId(null);

    try {
      const arr = Array.from(files);

      // küçük UX: çoklu upload’da fail olursa “hangi dosya” net olsun
      for (const file of arr) {
        await uploadOne(file);
      }

      toast.success(t("notifications.saved"));
      onChanged();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t("notifications.saveFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onSetCover(mediaId: string) {
    if (busy) return;
    setBusy(true);
    setOpId(mediaId);

    try {
      await setHero(productId, mediaId);
      toast.success(t("notifications.saved"));
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
    } finally {
      setBusy(false);
      setOpId(null);
    }
  }

  async function onDelete(mediaId: string) {
    const ok = window.confirm(t("actions.confirm.delete"));
    if (!ok) return;

    if (busy) return;
    setBusy(true);
    setOpId(mediaId);

    try {
      await removeMedia(productId, mediaId);
      toast.success(t("notifications.saved"));
      onChanged();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
    } finally {
      setBusy(false);
      setOpId(null);
    }
  }

  const btn =
    "h-8 rounded-md border px-2 text-xs hover:bg-muted disabled:opacity-50";

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            {t("pages.product_detail.tabs.media")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("products.media.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />

          <button
            type="button"
            className="h-9 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-50"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? t("common.saving") : t("products.media.upload")}
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          {t("products.media.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {media.map((m) => {
            const role = normRole(m.role);
            const isHero = heroMediaId === m.id || role === "HERO";
            const cardBusy = busy && opId === m.id;

            return (
              <div key={m.id} className="overflow-hidden rounded-xl border">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.url}
                    alt={m.alt ?? ""}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />

                  <div className="absolute left-2 top-2 flex gap-2">
                    {isHero ? (
                      <span className="rounded-md border bg-background/90 px-2 py-1 text-[11px]">
                        {t("products.media.cover")}
                      </span>
                    ) : (
                      <span className="rounded-md border bg-background/70 px-2 py-1 text-[11px]">
                        {role}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t p-2">
                  <button
                    type="button"
                    className={btn}
                    disabled={busy || isHero}
                    onClick={() => onSetCover(m.id)}
                  >
                    {cardBusy
                      ? t("common.saving")
                      : t("products.media.setCover")}
                  </button>

                  <button
                    type="button"
                    className={`${btn} text-red-600 hover:bg-red-50`}
                    disabled={busy}
                    onClick={() => onDelete(m.id)}
                  >
                    {cardBusy ? t("common.saving") : t("actions.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {t("products.translations.phaseNote")}
      </div>
    </div>
  );
}
