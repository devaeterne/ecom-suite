"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useT } from "@/i18n/use-t";

export default function ProductNewOrganizePage() {
  const t = useT();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">
        {t("products.product_detail.tabs.organize")}
      </div>

      {/* Info box */}
      <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
        <div className="mb-1 font-medium text-foreground">
          {t("products.product_detail.hints.createFirstTitle")}
        </div>
        <div>{t("products.product_detail.hints.organizeAfterCreate")}</div>
      </div>

      {/* Action */}
      <Link
        href={`/${locale}/products/new`}
        className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
      >
        {t("products.product_detail.actions.goToDetails")}
      </Link>
    </div>
  );
}
