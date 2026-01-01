import { StoreCategoryDto } from "@/modules/catalog/common/dto/category.dto";
import { StoreCollectionDto } from "@/modules/catalog/common/dto/collection.dto";
import { StoreProductDto } from "@/modules/catalog/common/dto/product.dto";

export function mapCategory(row: any): StoreCategoryDto {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    parentId: row.parentId ?? null,
  };
}

export function mapCollection(row: any): StoreCollectionDto {
  return {
    id: row.id,
    title: row.title,
    handle: row.handle,
  };
}

export function mapStoreProduct(row: any): StoreProductDto {
  return {
    id: row.id,
    title: row.title,
    handle: row.handle,
    status: row.status,
    description: row.description ?? null,
    publishedAt: row.publishedAt
      ? new Date(row.publishedAt).toISOString()
      : null,

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
