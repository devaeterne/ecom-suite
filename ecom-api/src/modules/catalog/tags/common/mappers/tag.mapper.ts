import { TagDto } from "@/modules/catalog/tags/common/dto/tag.dto";

type ProductTagModel = {
  id: string;
  tenantId: string;
  value: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

export function toTagDto(m: ProductTagModel): TagDto {
  return {
    id: m.id,
    tenantId: m.tenantId,
    value: m.value,
    metadata: (m.metadata ?? {}) as Record<string, any>,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}
