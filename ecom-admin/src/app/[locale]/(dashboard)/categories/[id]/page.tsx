"use client";

import { useEffect, useState } from "react";
import { Container, Heading, Text } from "@medusajs/ui";
import { useParams } from "next/navigation";
import { useT } from "@/i18n/use-t";
import { CategoriesApi, type Category } from "@/src/lib/api/product/categories";
import CategoryForm from "../_components/category-form";

export default function CategoryEditPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await CategoriesApi.get(id);
        if (mounted) setData(r);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <Container className="p-6">
      <Heading level="h1">{t("categories.edit.title")}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t("categories.edit.subtitle")}
      </Text>

      <div className="mt-6">
        <CategoryForm
          mode="edit"
          initial={data ?? undefined}
          loading={loading}
          categoryId={id}
        />
      </div>
    </Container>
  );
}
