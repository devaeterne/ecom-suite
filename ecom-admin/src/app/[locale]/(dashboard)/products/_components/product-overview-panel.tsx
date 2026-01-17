import { Text } from "@medusajs/ui"
import { useT } from "@/i18n/use-t"
import type { AdminProductDetail } from "../_types/products.types"

export function ProductOverviewPanel({ product }: { product: AdminProductDetail }) {
  const t = useT()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border p-4 space-y-2">
        <Text weight="plus">{t("pages.product_detail.tabs.overview")}</Text>
        <div className="space-y-2">
          <label className="block text-sm">
            <span className="text-ui-fg-subtle text-xs">{t("pages.product_detail.fields.title")}</span>
            <input className="mt-1 h-9 w-full rounded-md border px-3 text-sm" defaultValue={product.title} disabled />
          </label>

          <label className="block text-sm">
            <span className="text-ui-fg-subtle text-xs">{t("pages.product_detail.fields.status")}</span>
            <input className="mt-1 h-9 w-full rounded-md border px-3 text-sm" defaultValue={product.status} disabled />
          </label>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <Text weight="plus">{t("pages.product_detail.sections.organize")}</Text>
        <Text size="small" className="text-ui-fg-subtle">
          {t("products.overview.organizeHint")}
        </Text>
      </div>
    </div>
  )
}
