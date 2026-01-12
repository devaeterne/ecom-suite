"use client";

export function ProductsFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
      <input
        className="h-9 w-72 rounded-md border bg-background px-3 text-sm"
        placeholder="Search products…"
      />

      <select className="h-9 rounded-md border bg-background px-2 text-sm">
        <option value="">Status</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>

      <select className="h-9 rounded-md border bg-background px-2 text-sm" disabled>
        <option>Category (soon)</option>
      </select>

      <select className="h-9 rounded-md border bg-background px-2 text-sm" disabled>
        <option>Collection (soon)</option>
      </select>

      <button
        type="button"
        className="ml-auto h-9 rounded-md border px-3 text-sm hover:bg-muted"
        onClick={() => {
          // Aşama 2: query param reset
          console.log("clear filters");
        }}
      >
        Clear
      </button>
    </div>
  );
}
