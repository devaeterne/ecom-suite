import type { AdminMediaItem } from "../types/products.types";

export function ProductMediaPanel({ media }: { media: AdminMediaItem[] }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Media</h3>
          <p className="text-xs text-muted-foreground">Upload and reorder product images.</p>
        </div>
        <button className="h-9 rounded-md border px-3 text-sm opacity-60" disabled>
          Upload
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {media.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        Reorder (drag & drop) will be enabled in Phase 2. For now, UI skeleton is locked.
      </div>
    </div>
  );
}
