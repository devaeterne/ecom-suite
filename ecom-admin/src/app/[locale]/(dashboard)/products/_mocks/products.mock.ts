import {
  AdminMediaItem,
  AdminProductDetail,
  AdminProductListItem,
  AdminTranslationItem,
  AdminVariantListItem,
} from "../_types/products.types";

export const mockProducts: AdminProductListItem[] = [
  {
    id: "prod_01",
    title: "Basic T-Shirt",
    handle: "basic-tshirt",
    status: "published",
    variantsCount: 3,
    inventoryStatus: "in_stock",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod_02",
    title: "Hoodie",
    handle: "hoodie",
    status: "draft",
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
  createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockVariants: AdminVariantListItem[] = [
  {
    id: "var_01",
    title: "S / Black",
    sku: "TS-S-BLK",
    price: "€19.90",
    inventoryStatus: "in_stock",
  },
  {
    id: "var_02",
    title: "M / Black",
    sku: "TS-M-BLK",
    price: "€19.90",
    inventoryStatus: "low",
  },
];

export const mockMedia: AdminMediaItem[] = [
  { id: "img_1", url: "https://picsum.photos/seed/1/400/400" },
  { id: "img_2", url: "https://picsum.photos/seed/2/400/400" },
];

export const mockTranslations: AdminTranslationItem[] = [
  {
    locale: "en",
    title: "Basic T-Shirt",
    subtitle: "Soft cotton",
    description: "Minimal everyday t-shirt.",
  },
  {
    locale: "tr",
    title: "Basic Tişört",
    subtitle: "Yumuşak pamuk",
    description: "Günlük, sade bir tişört.",
  },
];
