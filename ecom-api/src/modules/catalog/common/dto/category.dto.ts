export type StoreCategoryDto = {
  id: string;
  name: string;
  handle: string;
  parentId: string | null;
  children?: StoreCategoryDto[];
};
