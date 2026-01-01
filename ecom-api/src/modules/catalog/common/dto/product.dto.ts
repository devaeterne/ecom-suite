export type StoreProductVariantDto = {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  isActive: boolean;
};

export type StoreProductDto = {
  id: string;
  title: string;
  handle: string;
  status: "draft" | "published" | "archived";
  description: string | null;
  publishedAt: string | null;
  categories: { id: string; name: string; handle: string }[];
  collections: { id: string; title: string; handle: string }[];
  variants: StoreProductVariantDto[];
};
