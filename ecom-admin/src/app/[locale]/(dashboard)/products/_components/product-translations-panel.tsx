import type { AdminTranslationItem } from "../types/products.types";

export function ProductTranslationsPanel({ items }: { items: AdminTranslationItem[] }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Translations</h3>
            <p className="text-xs text-muted-foreground">Manage product content per locale.</p>
          </div>

          <select className="h-9 rounded-md border bg-background px-2 text-sm">
            {items.map((i) => (
              <option key={i.locale} value={i.locale}>
                {i.locale.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Title</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue={items[0]?.title ?? ""} disabled />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Subtitle</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue={items[0]?.subtitle ?? ""} disabled />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea className="min-h-[120px] rounded-md border bg-background px-3 py-2" defaultValue={items[0]?.description ?? ""} disabled />
          </label>
        </div>
      </div>

      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        Phase 1: UI shell locked. Phase 4: API adaptation layer will persist translations.
      </div>
    </div>
  );
}
