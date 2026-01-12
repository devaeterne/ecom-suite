"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Text } from "@medusajs/ui"

import type { AdminProductDetail } from "../_types/products.types"

export function ProductDetailHeader({ product }: { product: AdminProductDetail }) {
  const params = useParams<{ locale: string }>()
  const locale = params?.locale ?? "en"

  return (
    <div className="space-y-2">
      <div className="text-sm text-ui-fg-subtle">
        <Link className="hover:underline" href={`/${locale}/products`}>
          Products
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
            Overview
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}/variants`}>
            Variants
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}/media`}>
            Media
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/products/${product.id}/translations`}>
            Translations
          </Link>
        </div>
      </div>
    </div>
  )
}
