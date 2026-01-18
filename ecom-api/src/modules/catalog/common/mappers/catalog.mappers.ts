import {
  StoreCategoryDto,
  AdminCategoryDto,
} from "@/modules/catalog/common/dto/category.dto";
import { StoreCollectionDto } from "@/modules/catalog/common/dto/collection.dto";
import { StoreProductDto } from "@/modules/catalog/common/dto/product.dto";

type CategoryTranslation = {
  localeCode: string;
  title: string;
  description?: string | null;
};
type ProductTranslation = {
  localeCode: string;
  title: string;
  description?: string | null;
  subtitle?: string | null;
};

function pickLocalized<T extends { localeCode: string }>(
  items: T[] | undefined | null,
  requested?: string | null,
  fallback?: string | null,
): T | null {
  const arr = items ?? [];
  if (!arr.length) return null;

  if (requested) {
    const hit = arr.find((x) => x.localeCode === requested);
    if (hit) return hit;
  }
  if (fallback) {
    const hit = arr.find((x) => x.localeCode === fallback);
    if (hit) return hit;
  }
  return arr[0] ?? null;
}

export function mapCategory(
  row: any,
  localeCode?: string,
): StoreCategoryDto | AdminCategoryDto {
  const t = pickLocalized<CategoryTranslation>(
    row.translations,
    localeCode,
    "en",
  );

  return {
    id: row.id,
    name: t?.title ?? row.name,
    handle: row.handle,
    parentId: row.parentId ?? null,

    // ✅ admin + store ortak alan
    isActive: !!row.isActive,
    productCount: Number(row?._count?.products ?? 0),

    // admin tarafı isterse kullanır
    createdAt: row.createdAt
      ? new Date(row.createdAt).toISOString()
      : undefined,
    updatedAt: row.updatedAt
      ? new Date(row.updatedAt).toISOString()
      : undefined,
  } as any;
}

export function mapCollection(row: any): StoreCollectionDto {
  return {
    id: row.id,
    title: row.title,
    handle: row.handle,
  };
}

export function mapStoreProduct(
  row: any,
  localeCode?: string,
): StoreProductDto {
  const t = pickLocalized<ProductTranslation>(
    row.translations,
    localeCode,
    "en",
  );

  return {
    id: row.id,
    title: t?.title ?? row.title,
    handle: row.handle,
    status: row.status,
    description: t?.description ?? row.description ?? null,
    publishedAt: row.publishedAt
      ? new Date(row.publishedAt).toISOString()
      : null,

    // ⚠️ category/collection/tag altlarında da localization istersen ayrıca ekleriz
    categories: (row.categories ?? []).map((l: any) => ({
      id: l.category.id,
      name: l.category.name,
      handle: l.category.handle,
    })),

    collections: (row.collections ?? []).map((l: any) => ({
      id: l.collection.id,
      title: l.collection.title,
      handle: l.collection.handle,
    })),

    variants: (row.variants ?? []).map((v: any) => ({
      id: v.id,
      title: v.title ?? "",
      sku: v.sku ?? null,
      barcode: v.barcode ?? null,
      isActive: !!v.isActive,
    })),
  };
}
