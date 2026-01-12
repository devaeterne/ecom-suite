"use client"

import PageHeader from "@/components/page-header/PageHeader"
import { useT } from "@/i18n/use-t"

import { ProductsFilters } from "./_components/products-filters"
import { ProductsTable } from "./_components/products-table"
import { mockProducts } from "./_mocks/products.mock"

export default function ProductsPage() {
  const t = useT()

  return (
    <div className="space-y-4">
      <PageHeader
        titleKey="topbar.title.products"
        subtitleKey="pages.products.subtitle"
      />

      <ProductsFilters />

      <ProductsTable
        items={mockProducts}
        labels={{
          product: t("products.columns.product"),
          status: t("products.columns.status"),
          variants: t("products.columns.variants"),
          inventory: t("products.columns.inventory"),
          updated: t("products.columns.updated"),
          actions: t("products.columns.actions"),
          view: t("common.actions.view"),
        }}
      />
    </div>
  )
}
