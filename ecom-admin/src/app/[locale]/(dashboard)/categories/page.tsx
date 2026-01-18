"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Container, Heading, Text } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import CategoryTable from "./_components/category-table";

export default function CategoriesPage() {
  const t = useT();
  const { locale } = useParams<{ locale: string }>();

  return (
    <Container className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">{t("pages.categories.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("pages.categories.subtitle")}
          </Text>
        </div>

        <Link href={`/${locale}/categories/new`}>
          <Button>{t("categories.actions.new")}</Button>
        </Link>
      </div>

      <div className="mt-6">
        <CategoryTable />
      </div>
    </Container>
  );
}
