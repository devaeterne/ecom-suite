// src/app/[locale]/(dashboard)/categories/_components/category-delete-dialog.tsx
"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, Text } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { CategoriesApi } from "@/src/lib/api/product/categories";

type Props = {
  categoryId: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function CategoryDeleteDialog({
  categoryId,
  onClose,
  onDeleted,
}: Props) {
  const t = useT();
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onConfirm() {
    setLoading(true);
    setErr(null);
    try {
      await CategoriesApi.remove(categoryId);
      onDeleted();
    } catch (e: any) {
      const msg =
        e?.data?.message || e?.data?.detail || e?.message || "Delete failed";
      setErr(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2
            rounded-xl bg-ui-bg-base shadow-elevation-modal outline-none
          "
        >
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-ui-fg-base font-medium">
                  {t("categories.delete.title")}
                </Dialog.Title>
                <Dialog.Description className="mt-1">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("categories.delete.subtitle")}
                  </Text>
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <button
                  className="text-ui-fg-subtle hover:text-ui-fg-base"
                  aria-label="Close"
                >
                  ✕
                </button>
              </Dialog.Close>
            </div>

            {err ? (
              <Text size="small" className="text-ui-fg-error">
                {err}
              </Text>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                {t("categories.common.cancel")}
              </Button>

              <Button onClick={onConfirm} isLoading={loading}>
                {t("categories.common.delete")}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
