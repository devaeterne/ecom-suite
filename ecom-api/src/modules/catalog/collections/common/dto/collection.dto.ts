export type CollectionMetadata = Record<string, any>;

export class CollectionDto {
  id!: string;
  tenantId!: string;

  title!: string;
  handle!: string;
  metadata!: CollectionMetadata;

  createdAt!: string; // ISO
  updatedAt!: string; // ISO
}

export class CollectionListDto {
  items!: CollectionDto[];
  total!: number;
  offset!: number;
  limit!: number;
}
