"use client";

import Link from "next/link";

export function RowActionsMenu({ productId }: { productId: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Link
        href={`/products/${productId}`}
        className="h-8 rounded-md border px-2 text-xs leading-8 hover:bg-muted"
      >
        View
      </Link>
      <button
        type="button"
        className="h-8 rounded-md border px-2 text-xs hover:bg-muted"
        onClick={() => console.log("actions", productId)}
      >
        •••
      </button>
    </div>
  );
}
