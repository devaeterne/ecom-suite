"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useT } from "@/i18n/use-t";
import { apiFetch } from "@/src/lib/api/_client/http";
import { toast, Table, Button, Input, Select } from "@medusajs/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSession } from "@/src/providers/app-session-provider";

// -------------------- types --------------------
type Variant = {
  id: string;
  title: string;
  sku?: string | null;
  barcode?: string | null;
  isActive: boolean;
  updatedAt?: string;
};

type Price = {
  id: string;
  priceSetId: string;
  currencyCode: string;
  amount: number;
  compareAt: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  isActive: boolean;
  priceSet?: {
    priceListId: string | null;
  };
};

type PriceList = {
  id: string;
  title: string;
  type: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

// -------------------- helpers --------------------
function money(amount: number, currency: string) {
  const v = (amount ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

function pickItems<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw.items)) return raw.items as T[];
  return [];
}

function toCents(input: string) {
  // "19.99" -> 1999
  const n = Number(String(input).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

function centsToUi(amount: number) {
  // 1999 -> "19.99"
  return ((amount ?? 0) / 100).toFixed(2);
}

// -------------------- page --------------------
export default function ProductVariantsPage() {
  const t = useT();
  const params = useParams<{ id: string; locale: string }>();
  const locale = params?.locale ?? "en";
  const productId = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [pricesByVariant, setPricesByVariant] = useState<
    Record<string, Price[]>
  >({});
  const [openVariantId, setOpenVariantId] = useState<string | null>(null);

  const priceListMap = useMemo(() => {
    const m = new Map<string, PriceList>();
    for (const pl of priceLists) m.set(pl.id, pl);
    return m;
  }, [priceLists]);

  const load = async () => {
    if (!productId) return;
    setLoading(true);

    try {
      const [vRaw, plRaw] = await Promise.all([
        apiFetch<any>(`/api/admin/products/${productId}/variants`, {
          method: "GET",
          credentials: "include",
        }),
        apiFetch<any>(`/api/admin/price-lists`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const vItems = pickItems<Variant>(vRaw);
      const plItems = pickItems<PriceList>(plRaw);

      setVariants(vItems);
      setPriceLists(plItems);

      const priceEntries = await Promise.all(
        vItems.map(async (v) => {
          try {
            const pRaw = await apiFetch<any>(
              `/api/admin/variants/${v.id}/prices`,
              {
                method: "GET",
                credentials: "include",
              },
            );
            return [v.id, pickItems<Price>(pRaw)] as const;
          } catch {
            return [v.id, [] as Price[]] as const;
          }
        }),
      );

      setPricesByVariant(Object.fromEntries(priceEntries));
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.loadFailed"));
      setVariants([]);
      setPriceLists([]);
      setPricesByVariant({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  function regularPrice(prices: Price[]) {
    const base = prices.filter(
      (p) =>
        p.isActive &&
        !p.priceSet?.priceListId &&
        !p.minQuantity &&
        !p.maxQuantity,
    );
    if (!base.length) return null;
    return base.slice().sort((a, b) => a.amount - b.amount)[0];
  }

  function bestPrice(prices: Price[]) {
    const active = prices.filter(
      (p) => p.isActive && !p.minQuantity && !p.maxQuantity,
    );
    if (!active.length) return null;
    return active.slice().sort((a, b) => a.amount - b.amount)[0];
  }

  const box = "rounded-xl border p-4";

  return (
    <div className={box}>
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">
          {t("pages.product_detail.tabs.variants")}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {variants.length} {t("products.items")}
        </div>
      </div>

      {loading ? (
        <div className="mt-3 text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : variants.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground">
          {t("pages.product_detail.pricing.empty")}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>
                  {t("products.columns.product")}
                </Table.HeaderCell>
                <Table.HeaderCell>{t("pricing.labels.sku")}</Table.HeaderCell>
                <Table.HeaderCell>
                  {t("products.columns.status")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("pricing.labels.regular")}
                </Table.HeaderCell>
                <Table.HeaderCell>{t("pricing.labels.best")}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  {t("products.columns.actions")}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {variants.map((v) => {
                const prices = pricesByVariant[v.id] ?? [];
                const reg = regularPrice(prices);
                const best = bestPrice(prices);

                return (
                  <Table.Row key={v.id}>
                    <Table.Cell>
                      <div className="font-medium">{v.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.barcode ?? ""}
                      </div>
                    </Table.Cell>

                    <Table.Cell className="text-sm">{v.sku ?? "—"}</Table.Cell>

                    <Table.Cell className="text-sm">
                      {v.isActive ? t("common.active") : t("common.inactive")}
                    </Table.Cell>

                    <Table.Cell>
                      {reg ? (
                        <>
                          {reg.priceListId && (
                            <div className="text-xs text-muted-foreground">
                              {priceListMap.get(reg.priceListId)?.title ??
                                t("pricing.labels.regular")}
                            </div>
                          )}
                          {reg.compareAt ? (
                            <div className="text-xs line-through text-muted-foreground">
                              {money(reg.compareAt, reg.currencyCode)}
                            </div>
                          ) : null}
                          <div>{money(reg.amount, reg.currencyCode)}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </Table.Cell>

                    <Table.Cell className="text-sm">
                      {best ? money(best.amount, best.currencyCode) : "—"}
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => setOpenVariantId(v.id)}
                      >
                        {t("pricing.actions.managePrices")}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      )}

      <PriceModal
        open={!!openVariantId}
        onClose={() => setOpenVariantId(null)}
        variantId={openVariantId}
        prices={openVariantId ? (pricesByVariant[openVariantId] ?? []) : []}
        priceListMap={priceListMap}
        priceLists={priceLists}
        onRefresh={load}
        locale={locale}
      />
    </div>
  );
}

// -------------------- modal --------------------
function PriceModal({
  open,
  onClose,
  variantId,
  prices,
  priceListMap,
  priceLists,
  onRefresh,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  variantId: string | null;
  prices: Price[];
  priceListMap: Map<string, PriceList>;
  priceLists: PriceList[];
  onRefresh: () => void;
  locale: string;
}) {
  const t = useT();
  const session = useAppSession();

  const defaultCurrencyCode =
    session?.tenant?.defaultCurrencyCode ??
    session?.defaultCurrencyCode ??
    "EUR";

  const supportedCurrencyCodes = Array.from(
    new Set(
      (
        session?.tenant?.supportedCurrencyCodes ??
        session?.supportedCurrencyCodes ?? [defaultCurrencyCode]
      ).filter(Boolean),
    ),
  );

  // create form
  const [amount, setAmount] = useState("");
  const [compareAt, setCompareAt] = useState(""); // ✅ NEW (create)
  const [currencyCode, setCurrencyCode] = useState(defaultCurrencyCode);
  const [priceListId, setPriceListId] = useState<string>(""); // "" => regular

  // priceList create
  const [newPriceListTitle, setNewPriceListTitle] = useState("");
  const [creatingPriceList, setCreatingPriceList] = useState(false);

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCompareAt, setEditCompareAt] = useState(""); // ✅ NEW (edit)
  const [editCurrency, setEditCurrency] = useState(defaultCurrencyCode);
  const [editPriceListId, setEditPriceListId] = useState<string>("");
  const [editActive, setEditActive] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setCompareAt(""); // ✅ reset
    setCurrencyCode(defaultCurrencyCode);

    setNewPriceListTitle("");
    setCreatingPriceList(false);

    setEditingId(null);
    setBusyId(null);
  }, [open, defaultCurrencyCode]);

  async function onCreatePrice() {
    if (!variantId) return;

    const cents = toCents(amount);
    if (cents === null) {
      toast.error(t("notifications.invalidAmount"));
      return;
    }

    const compareCents = compareAt ? toCents(compareAt) : null;
    if (compareAt && compareCents === null) {
      toast.error(t("notifications.invalidAmount"));
      return;
    }
    if (compareCents != null && compareCents <= cents) {
      toast.error(t("pricing.validation.compareAtGreater"));
      return;
    }
    console.log("CREATE PRICE BODY", {
      priceListId,
      normalized: priceListId === "" ? null : priceListId,
    });
    try {
      await apiFetch(`/api/admin/variants/${variantId}/prices`, {
        method: "POST",
        credentials: "include",
        body: {
          priceListId: priceListId === "" ? null : priceListId,
          currencyCode,
          amount: cents,
          compareAt: compareCents,
        },
      });
      console.log("CREATE PRICE BODY", {
        priceListId,
        currencyCode,
        amount: cents,
        compareAt: compareCents,
      });
      toast.success(t("notifications.saved"));
      setAmount("");
      setCompareAt("");
      //setPriceListId("");
      setCurrencyCode(defaultCurrencyCode);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
    }
  }

  function startEdit(p: Price) {
    setEditingId(p.id);
    setEditAmount(centsToUi(p.amount));
    setEditCurrency(p.currencyCode || defaultCurrencyCode);
    setEditPriceListId(p.priceListId ?? "");
    setEditActive(!!p.isActive);
    setEditCompareAt(p.compareAt ? centsToUi(p.compareAt) : "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onUpdatePrice(priceId: string) {
    const cents = toCents(editAmount);
    if (cents === null) {
      toast.error(t("notifications.invalidAmount"));
      return;
    }
    const compareCents = editCompareAt ? toCents(editCompareAt) : null;
    if (editCompareAt && compareCents === null) {
      toast.error(t("notifications.invalidAmount"));
      return;
    }
    if (compareCents != null && compareCents <= cents) {
      toast.error(t("pricing.validation.compareAtGreater"));
      return;
    }
    if (editCompareAt && toCents(editCompareAt)! <= cents) {
      toast.error(t("pricing.validation.compareAtGreater"));
      return;
    }
    setBusyId(priceId);
    try {
      await apiFetch(`/api/admin/variants/${variantId}/prices/${priceId}`, {
        method: "PATCH",
        credentials: "include",
        body: {
          priceListId: editPriceListId || null,
          currencyCode: editCurrency,
          amount: cents,
          compareAt: editCompareAt ? toCents(editCompareAt) : null, // ✅ eklendi
          isActive: editActive,
        },
      });
      toast.success(t("notifications.saved"));
      setEditingId(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.saveFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function onDeletePrice(priceId: string) {
    // basit confirm (şimdilik). Sonra Medusa modal confirm’e çeviririz.
    // eslint-disable-next-line no-alert
    const ok = window.confirm(t("pricing.confirm.deletePrice"));
    if (!ok) return;

    setBusyId(priceId);
    try {
      await apiFetch(`/api/admin/variants/${variantId}/prices/${priceId}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast.success(t("notifications.deleted"));
      if (editingId === priceId) setEditingId(null);
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error(t("notifications.deleteFailed"));
    } finally {
      setBusyId(null);
    }
  }

  async function onCreatePriceList() {
    const title = newPriceListTitle.trim();
    if (title.length < 2) {
      toast.error(t("pricing.priceList.validation.titleMin"));
      return;
    }

    setCreatingPriceList(true);
    try {
      await apiFetch(`/api/admin/price-lists`, {
        method: "POST",
        credentials: "include",
        body: {
          title,
          type: "SALE",
        },
      });
      toast.success(t("pricing.priceList.notifications.created"));
      setNewPriceListTitle("");
      onRefresh(); // priceLists tekrar gelsin
    } catch (e) {
      console.error(e);
      toast.error(t("pricing.priceList.notifications.createFailed"));
    } finally {
      setCreatingPriceList(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("pricing.title.manage")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* PriceList quick create */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">
                  {t("pricing.priceList.title.quickCreate")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("pricing.priceList.hints.manageSeparately")}
                </div>
              </div>

              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  window.open(
                    `/${locale}/products/pricelist`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                {t("pricing.priceList.actions.openManager")}
              </Button>
            </div>
          </div>

          {/* existing prices */}
          <div className="rounded-lg border">
            <div className="divide-y">
              {prices.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t("pricing.empty")}
                </div>
              ) : (
                prices.map((p) => {
                  const priceListId = p.priceSet?.priceListId ?? null;
                  const pl = priceListId ? priceListMap.get(priceListId) : null;

                  const label = pl ? pl.title : t("pricing.labels.regular");
                  const isEditing = editingId === p.id;
                  const busy = busyId === p.id;

                  return (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-[220px]">
                          <div className="font-medium text-sm">{label}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.currencyCode} •{" "}
                            {p.isActive
                              ? t("common.active")
                              : t("common.inactive")}
                          </div>
                        </div>

                        <div className="ml-auto font-medium text-sm">
                          {money(p.amount, p.currencyCode)}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="small"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              isEditing ? cancelEdit() : startEdit(p)
                            }
                          >
                            {isEditing ? t("common.cancel") : t("common.edit")}
                          </Button>

                          <Button
                            size="small"
                            variant="danger"
                            disabled={busy}
                            onClick={() => onDeletePrice(p.id)}
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              {t("pricing.labels.amount")}
                            </div>
                            <input
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="19.99"
                            />
                          </div>

                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              {t("pricing.labels.compareAt")}
                            </div>
                            <input
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                              value={editCompareAt}
                              onChange={(e) => setEditCompareAt(e.target.value)}
                              placeholder="29.99"
                            />
                            +{" "}
                          </div>

                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              {t("pricing.labels.currency")}
                            </div>

                            {supportedCurrencyCodes.length <= 1 ? (
                              <input
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                                value={defaultCurrencyCode}
                                disabled
                              />
                            ) : (
                              <select
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                value={editCurrency}
                                onChange={(e) =>
                                  setEditCurrency(e.target.value)
                                }
                              >
                                {supportedCurrencyCodes.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              {t("pricing.labels.priceList")}
                            </div>
                            <select
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                              value={editPriceListId}
                              onChange={(e) =>
                                setEditPriceListId(e.target.value)
                              }
                            >
                              <option value="">
                                {t("pricing.labels.regular")}
                              </option>
                              {priceLists.map((pl) => (
                                <option key={pl.id} value={pl.id}>
                                  {pl.title}{" "}
                                  {pl.isActive
                                    ? ""
                                    : `(${t("common.inactive")})`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              {t("pricing.labels.compareAt")}
                            </div>
                            <input
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                              value={editCompareAt}
                              onChange={(e) => setEditCompareAt(e.target.value)}
                              placeholder="29.99"
                            />
                          </div>

                          <div>
                            <div className="text-xs font-medium text-muted-foreground">
                              {t("pricing.labels.active")}
                            </div>
                            <select
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                              value={editActive ? "1" : "0"}
                              onChange={(e) =>
                                setEditActive(e.target.value === "1")
                              }
                            >
                              <option value="1">{t("common.active")}</option>
                              <option value="0">{t("common.inactive")}</option>
                            </select>
                          </div>

                          <div className="md:col-span-4 flex justify-end">
                            <Button
                              size="small"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => onUpdatePrice(p.id)}
                            >
                              {busy ? t("common.saving") : t("common.save")}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* create price */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium">
              {t("pricing.actions.add")}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("pricing.labels.amount")}
                </div>
                <input
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="19.99"
                />
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("pricing.labels.compareAt")}
                </div>

                <input
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  placeholder="29.99"
                />
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("pricing.labels.currency")}
                </div>

                {supportedCurrencyCodes.length <= 1 ? (
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none"
                    value={defaultCurrencyCode}
                    disabled
                  />
                ) : (
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                  >
                    {supportedCurrencyCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  {t("pricing.labels.priceList")}
                </div>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={priceListId}
                  onChange={(e) => setPriceListId(e.target.value)}
                >
                  <option value="">{t("pricing.labels.regular")}</option>
                  {priceLists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.title}{" "}
                      {pl.isActive ? "" : `(${t("common.inactive")})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
                onClick={onClose}
              >
                {t("common.close")}
              </button>

              <button
                type="button"
                className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
                onClick={onCreatePrice}
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
