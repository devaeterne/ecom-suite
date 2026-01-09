import { CollectionDto } from "@/modules/catalog/collections/common/dto/collection.dto";

type ProductCollectionModel = {
  id: string;
  tenantId: string;
  title: string;
  handle: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

export function toCollectionDto(m: ProductCollectionModel): CollectionDto {
  return {
    id: m.id,
    tenantId: m.tenantId,
    title: m.title,
    handle: m.handle,
    metadata: (m.metadata ?? {}) as Record<string, any>,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}
