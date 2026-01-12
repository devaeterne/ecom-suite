import type { AdminVariantListItem } from "../types/products.types";
import { InventoryBadge } from "./inventory-badge";

export function ProductVariantsPanel({ variants }: { variants: AdminVariantListItem[] }) {
  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Variants</h3>
          <p className="text-xs text-muted-foreground">Manage SKUs, pricing and inventory.</p>
        </div>
        <button className="h-9 rounded-md border px-3 text-sm opacity-60" disabled>
          Add variant
        </button>
      </div>

      <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-5">Variant</div>
        <div className="col-span-3">SKU</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">Inventory</div>
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
