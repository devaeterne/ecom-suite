import type { AdminVariantListItem } from "@/src/modules/products/types/products.types";
import { InventoryBadge } from "./inventory-badge";
import { useT } from "@/i18n/use-t";

export function ProductVariantsPanel({ variants }: { variants: AdminVariantListItem[] }) {
  const t = useT();
  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{t("pages.product_detail.tabs.variants")}</h3>
          <p className="text-xs text-muted-foreground">{t("products.variants.subtitle")}</p>
        </div>
        <button className="h-9 rounded-md border px-3 text-sm opacity-60" disabled>
          {t("products.variants.add")}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-5">{t("products.variants.columns.variant")}</div>
        <div className="col-span-3">{t("products.variants.columns.sku")}</div>
        <div className="col-span-2">{t("products.variants.columns.price")}</div>
        <div className="col-span-2">{t("products.variants.columns.inventory")}</div>
      </div>

      <div className="divide-y">
        {variants.map((v) => (
          <div key={v.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/40">
            <div className="col-span-5 font-medium">{v.title}</div>
            <div className="col-span-3 text-muted-foreground">{v.sku ?? "-"}</div>
            <div className="col-span-2">{v.price ?? "-"}</div>
            <div className="col-span-2">
              <InventoryBadge status={v.inventoryStatus} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
