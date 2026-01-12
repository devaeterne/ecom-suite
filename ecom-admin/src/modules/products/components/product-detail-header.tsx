"use client";

import Link from "next/link";
import type { AdminProductDetail } from "../types/products.types";
import { ProductStatusBadge } from "./product-status-badge";

export function ProductDetailHeader({ product, basePath }: { product: AdminProductDetail; basePath: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:underline">Products</Link>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{product.title}</h1>
            <ProductStatusBadge status={product.status} />
          </div>
          <p className="text-sm text-muted-foreground">{product.subtitle ?? ""}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-9 rounded-md border px-3 text-sm opacity-60" disabled>
            Save
          </button>
          <button className="h-9 rounded-md border px-3 text-sm opacity-60" disabled>
            Publish
          </button>
          <Link
            href={`${basePath}/variants`}
            className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
            title="Go to variants"
          >
            Variants
          </Link>
        </div>
      </div>
    </div>
  );
}
