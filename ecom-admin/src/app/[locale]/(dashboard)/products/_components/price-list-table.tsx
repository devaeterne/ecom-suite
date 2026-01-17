"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch, toast } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { apiFetch } from "@/src/lib/api/_client/http";

// ---------------- types ----------------
type PriceList = {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

// ---------------- component ----------------
export function PriceListTable() {
  const t = useT();
  const [items, setItems] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/api/admin/price-lists`, {
        method: "GET",
        credentials: "include",
      });

      const list: PriceList[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
          ? res.items
          : [];
      setItems(list);
      setSelected(new Set());
    } catch {
      toast.error(t("notifications.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }
  async function toggleOne(id: string, isActive: boolean) {
    // 🔥 optimistic update
    setItems((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, isActive } : pl)),
    );

    try {
      await apiFetch(`/api/admin/price-lists/${id}`, {
        method: "PATCH",
        credentials: "include",
        body: { isActive },
      });
      toast.success(t("notifications.saved"));
    } catch {
      toast.error(t("notifications.saveFailed"));
      // ❗ rollback
      setItems((prev) =>
        prev.map((pl) => (pl.id === id ? { ...pl, isActive: !isActive } : pl)),
      );
    }
  }

  async function bulkUpdate(isActive: boolean) {
    if (
      !window.confirm(
        isActive
          ? t("pricing.priceList.confirm.activate")
          : t("pricing.priceList.confirm.deactivate"),
      )
    )
      return;

    setBusy(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          apiFetch(`/api/admin/price-lists/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: { isActive },
          }),
        ),
      );
      toast.success(t("notifications.saved"));
      load();
    } catch {
      toast.error(t("notifications.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete() {
    if (!window.confirm(t("pricing.priceList.confirm.delete"))) return;

    setBusy(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          apiFetch(`/api/admin/price-lists/${id}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      );
      toast.success(t("notifications.deleted"));
      load();
    } catch {
      toast.error(t("notifications.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="text-sm font-medium">
            {t("pricing.priceList.title.quickCreate")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("pricing.priceList.hints.ForTheActions")}
          </div>
        </div>

        <button
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          onClick={() => {
            window.location.href = `/${document.documentElement.lang || "en"}/products/pricelist/new`;
          }}
        >
          <span className="text-base leading-none">+</span>
          {t("common.new")}
        </button>
      </div>
      {/* bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 border-b px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            {selected.size} selected
          </span>

          <button
            disabled={busy}
            className="rounded-md border px-3 py-1"
            onClick={() => bulkUpdate(true)}
          >
            {t("pricing.priceList.actions.activate")}
          </button>

          <button
            disabled={busy}
            className="rounded-md border px-3 py-1"
            onClick={() => bulkUpdate(false)}
          >
            {t("pricing.priceList.actions.deactivate")}
          </button>

          <button
            disabled={busy}
            className="rounded-md border px-3 py-1 text-red-600"
            onClick={bulkDelete}
          >
            {t("pricing.priceList.actions.delete")}
          </button>
        </div>
      )}

      {/* header */}
      <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
          />
        </div>
        <div className="col-span-3">{t("pricing.priceList.columns.title")}</div>
        <div className="col-span-2">{t("pricing.priceList.columns.type")}</div>
        <div className="col-span-2">
          {t("pricing.priceList.columns.status")}
        </div>
        <div className="col-span-2">
          {t("pricing.priceList.columns.active")}
        </div>
        <div className="col-span-2">{t("pricing.priceList.columns.date")}</div>
      </div>

      {/* body */}
      <div className="divide-y">
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {t("pricing.priceList.empty")}
          </div>
        ) : (
          items.map((pl) => (
            <div
              key={pl.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm ${pl.isActive ? "" : "opacity-60"
                }`}
            >
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selected.has(pl.id)}
                  onChange={() => toggleSelect(pl.id)}
                />
              </div>

              <div className="col-span-3 font-medium">{pl.title}</div>

              <div className="col-span-2 text-xs">{pl.type}</div>

              <div className="col-span-2">
                {pl.isActive ? t("common.active") : t("common.inactive")}
              </div>

              <div className="col-span-2">
                <Switch
                  checked={pl.isActive}
                  disabled={busy}
                  onCheckedChange={(v) => toggleOne(pl.id, v)}
                />
              </div>

              <div className="col-span-2 text-xs text-muted-foreground">
                {pl.startsAt || "—"} / {pl.endsAt || "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
