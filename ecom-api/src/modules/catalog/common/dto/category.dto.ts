export type StoreCategoryDto = {
  id: string;
  name: string;
  handle: string;
  parentId: string | null;
  children?: StoreCategoryDto[];

  // 🔹 store tarafı için opsiyonel (store API bozmaz)
  isActive?: boolean;
  productCount?: number;
};

export type AdminCategoryDto = {
  id: string;
  name: string;
  handle: string;
  parentId: string | null;
  children?: AdminCategoryDto[];

  // 🔹 admin tarafı için zorunlu
  isActive: boolean;
  productCount?: number;

  createdAt?: string;
  updatedAt?: string;
};
