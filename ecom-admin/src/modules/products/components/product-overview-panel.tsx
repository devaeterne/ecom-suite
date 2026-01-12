import type { AdminProductDetail } from "../types/products.types";

export function ProductOverviewPanel({ product }: { product: AdminProductDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border p-4">
        <h3 className="text-sm font-semibold">General</h3>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Title</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue={product.title} disabled />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Handle</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue="@basic-tshirt" disabled />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Status</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue={product.status} disabled />
          </label>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="text-sm font-semibold">Organization</h3>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Category</span>
            <input className="h-9 rounded-md border bg-background px-3" value="(coming soon)" readOnly />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Collection</span>
            <input className="h-9 rounded-md border bg-background px-3" value="(coming soon)" readOnly />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Tags</span>
            <input className="h-9 rounded-md border bg-background px-3" value="(coming soon)" readOnly />
          </label>
        </div>
      </div>

      <div className="rounded-xl border p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold">Metadata</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Metadata editor will be available after API integration.
        </p>
      </div>
    </div>
  );
}
