// app/[locale]/products/pricelist/_components/price-list-active-toggle.tsx
"use client";

import { Switch, toast } from "@medusajs/ui";
import { apiFetch } from "@/src/lib/api/_client/http";

export function PriceListActiveToggle({ pl, onUpdated }) {
  async function onToggle(next: boolean) {
    const ok = window.confirm(
      next
        ? "Price list aktif edilecek. Bağlı aktif fiyatlar uygulanacaktır. Devam edilsin mi?"
        : "Price list pasif edilecek. Kampanya durdurulacaktır. Devam edilsin mi?",
    );
    if (!ok) return;

    try {
      await apiFetch(`/api/admin/price-lists/${pl.id}`, {
        method: "PATCH",
        credentials: "include",
        body: { isActive: next },
      });

      toast.success("Price list güncellendi");
      onUpdated();
    } catch (e) {
      console.error(e);
      toast.error("Price list güncellenemedi");
    }
  }

  return <Switch checked={pl.isActive} onCheckedChange={onToggle} />;
}
