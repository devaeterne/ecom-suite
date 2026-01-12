"use client";

import type { AdminProductListItem } from "../types/products.types";
import { ProductStatusBadge } from "./product-status-badge";
import { InventoryBadge } from "./inventory-badge";
import { RowActionsMenu } from "./row-actions-menu";

export function ProductsTable({ items }: { items: AdminProductListItem[] }) {
  return (
    <div className="rounded-xl border">
      <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-5">Product</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Variants</div>
        <div className="col-span-2">Inventory</div>
        <div className="col-span-1">Updated</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      <div className="divide-y">
        {items.map((p) => (
          <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-muted/40">
            <div className="col-span-5">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.handle ? `@${p.handle}` : ""}</div>
            </div>
            <div className="col-span-2">
              <ProductStatusBadge status={p.status} />
            </div>
            <div className="col-span-1">{p.variantsCount}</div>
            <div className="col-span-2">
              <InventoryBadge status={p.inventoryStatus} />
            </div>
            <div className="col-span-1 text-xs text-muted-foreground">
              {new Date(p.updatedAt).toLocaleDateString()}
            </div>
            <div className="col-span-1">
              <RowActionsMenu productId={p.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
