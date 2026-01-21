"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useT } from "@/i18n/use-t";

export default function ProductNewVariantsPage() {
  const t = useT();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div className="text-sm font-medium">
        {t("pages.product_detail.tabs.variants")}
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
        <div className="mb-1 font-medium text-foreground">
          {t("products.product_detail.hints.createFirstTitle")}
        </div>
        <div>{t("products.product_detail.hints.variantsAfterCreate")}</div>
      </div>

      <Link
        href={`/${locale}/products/new`}
        className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted/40"
      >
        {t("products.product_detail.actions.goToDetails")}
      </Link>
    </div>
  );
}
