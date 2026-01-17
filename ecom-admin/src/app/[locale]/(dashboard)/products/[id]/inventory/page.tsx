"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useT } from "@/i18n/use-t";

export default function ProductEditInventoryPage() {
  const t = useT();
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "en";
  const id = params?.id ?? "";

  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm font-medium">{t("products.tabs.inventory")}</div>
      <div className="mt-2 text-sm text-muted-foreground">
        {t("products.edit.todo.inventory")}
      </div>

      <div className="mt-4">
        <Link
          href={`/${locale}/products/${id}/variants`}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted/40"
        >
          {t("products.edit.goVariantsForInventory")}
        </Link>
      </div>
    </div>
  );
}
