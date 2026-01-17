"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Text } from "@medusajs/ui"
import { useT } from "@/i18n/use-t"

import type { AdminProductDetail } from "../_types/products.types"

export function ProductDetailHeader({ product }: { product: AdminProductDetail }) {
  const t = useT()
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  return (
    <div className="space-y-2">
      <div className="text-sm text-ui-fg-subtle">
        <Link className="hover:underline" href={`/${locale}/products`}>
          {t("topbar.title.products")}
        </Link>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <Text weight="plus">{product.title}</Text>
          {product.subtitle ? (
            <Text size="small" className="text-ui-fg-subtle">
              {product.subtitle}
            </Text>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}`}>
            {t("pages.product_detail.tabs.overview")}
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}/variants`}>
            {t("pages.product_detail.tabs.variants")}
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}/media`}>
            {t("pages.product_detail.tabs.media")}
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}/translations`}>
            {t("pages.product_detail.tabs.translations")}
          </Link>
        </div>
      </div>
    </div>
  )
}
