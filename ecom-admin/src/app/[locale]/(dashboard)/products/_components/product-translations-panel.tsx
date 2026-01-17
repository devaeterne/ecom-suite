import type { AdminTranslationItem } from "@/src/modules/products/types/products.types";
import { useT } from "@/i18n/use-t";

export function ProductTranslationsPanel({ items }: { items: AdminTranslationItem[] }) {
  const t = useT();
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t("pages.product_detail.tabs.translations")}</h3>
            <p className="text-xs text-muted-foreground">{t("pages.product_detail.tabs.translations")}</p>
          </div>

          <select className="h-9 rounded-md border bg-background px-2 text-sm">
            {items.map((i) => (
              <option key={i.locale} value={i.locale}>
                {i.locale.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">{t("pages.product_detail.fields.title")}</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue={items[0]?.title ?? ""} disabled />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">{t("products.translations.fields.subtitle")}</span>
            <input className="h-9 rounded-md border bg-background px-3" defaultValue={items[0]?.subtitle ?? ""} disabled />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">{t("pages.product_detail.fields.description")}</span>
            <textarea className="min-h-[120px] rounded-md border bg-background px-3 py-2" defaultValue={items[0]?.description ?? ""} disabled />
          </label>
        </div>
      </div>

      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        {t("products.translations.phaseNote")}
      </div>
    </div>
  );
}
