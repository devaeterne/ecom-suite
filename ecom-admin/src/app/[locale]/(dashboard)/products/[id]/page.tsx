"use client"

import { mockProductDetail } from "@/src/app/[locale]/(dashboard)/products/_mocks/products.mock"
import { ProductDetailHeader } from "@/src/app/[locale]/(dashboard)/products/_components/product-detail-header"
import { ProductOverviewPanel } from "@/src/app/[locale]/(dashboard)/products/_components/product-overview-panel"

export default function ProductOverviewPage({
  params,
}: {
  params: { id: string }
}) {
  const product = { ...mockProductDetail, id: params.id }

  return (
    <div className="space-y-4">
      <ProductDetailHeader product={product} />
      <ProductOverviewPanel product={product} />
    </div>
  )
}
