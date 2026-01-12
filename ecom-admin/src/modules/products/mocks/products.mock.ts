import type {
  AdminMediaItem,
  AdminProductDetail,
  AdminProductListItem,
  AdminTranslationItem,
  AdminVariantListItem,
} from "../types/products.types";

export const mockProducts: AdminProductListItem[] = [
  {
    id: "prod_01",
    title: "Basic T-Shirt",
    handle: "basic-tshirt",
    status: "published",
    thumbnailUrl: "",
    variantsCount: 3,
    inventoryStatus: "in_stock",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod_02",
    title: "Hoodie",
    handle: "hoodie",
    status: "draft",
    thumbnailUrl: "",
    variantsCount: 2,
    inventoryStatus: "low",
    updatedAt: new Date().toISOString(),
  },
];

export const mockProductDetail: AdminProductDetail = {
  id: "prod_01",
  title: "Basic T-Shirt",
  subtitle: "@basic-tshirt · Updated just now",
  status: "published",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockVariants: AdminVariantListItem[] = [
  { id: "var_01", title: "S / Black", sku: "TS-S-BLK", price: "€19.90", inventoryStatus: "in_stock" },
  { id: "var_02", title: "M / Black", sku: "TS-M-BLK", price: "€19.90", inventoryStatus: "low" },
];

export const mockMedia: AdminMediaItem[] = [
  { id: "img_01", url: "https://picsum.photos/seed/prod1/400/400", alt: "Product image 1" },
  { id: "img_02", url: "https://picsum.photos/seed/prod2/400/400", alt: "Product image 2" },
  { id: "img_03", url: "https://picsum.photos/seed/prod3/400/400", alt: "Product image 3" },
];

export const mockTranslations: AdminTranslationItem[] = [
  { locale: "en", title: "Basic T-Shirt", subtitle: "Soft cotton", description: "A minimal everyday tee." },
  { locale: "tr", title: "Basic Tişört", subtitle: "Yumuşak pamuk", description: "Günlük, sade bir tişört." },
];
