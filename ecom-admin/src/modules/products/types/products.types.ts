export type ProductStatus = "draft" | "published" | "archived";
export type InventoryStatus = "in_stock" | "low" | "out";

export type AdminProductListItem = {
  id: string;
  title: string;
  handle?: string;
  status: ProductStatus;
  thumbnailUrl?: string;
  variantsCount: number;
  inventoryStatus: InventoryStatus;
  updatedAt: string; // ISO
};

export type AdminProductDetail = {
  id: string;
  title: string;
  subtitle?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminVariantListItem = {
  id: string;
  title: string;
  sku?: string;
  price?: string;
  inventoryStatus: InventoryStatus;
};

export type AdminMediaItem = {
  id: string;
  url: string;
  alt?: string;
};

export type AdminTranslationItem = {
  locale: string; // e.g. "en", "tr"
  title?: string;
  subtitle?: string;
  description?: string;
};
