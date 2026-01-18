"use client";

import { Container, Heading, Text } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import CategoryForm from "../_components/category-form";

export default function CategoryNewPage() {
  const t = useT();

  return (
    <Container className="p-6">
      <Heading level="h1">{t("categories.new.title")}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t("categories.new.subtitle")}
      </Text>

      <div className="mt-6">
        <CategoryForm mode="create" />
      </div>
    </Container>
  );
}
