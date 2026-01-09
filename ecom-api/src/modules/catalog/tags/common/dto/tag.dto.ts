export type TagMetadata = Record<string, any>;

export class TagDto {
  id!: string;
  tenantId!: string;

  value!: string;
  metadata!: TagMetadata;

  createdAt!: string;
  updatedAt!: string;
}

export class TagListDto {
  items!: TagDto[];
  total!: number;
  offset!: number;
  limit!: number;
}
