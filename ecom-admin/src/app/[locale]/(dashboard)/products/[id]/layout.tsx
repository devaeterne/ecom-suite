"use client"

import React from "react"
import { useT } from "@/i18n/use-t"
import { ProductDetailHeader } from "@/src/app/[locale]/(dashboard)/products/_components/product-detail-header"
import {
  ProductDetailProvider,
  useProductDetail,
} from "./_components/product-detail-provider"

function Shell({ children }: { children: React.ReactNode }) {
  const t = useT()
  const { loading, product } = useProductDetail()

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : product ? (
        <ProductDetailHeader product={product} />
      ) : (
        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
          {t("errors.productNotFound")}
        </div>
      )}

      {children}
    </div>
  )
}

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductDetailProvider>
      <Shell>{children}</Shell>
    </ProductDetailProvider>
  )
}
