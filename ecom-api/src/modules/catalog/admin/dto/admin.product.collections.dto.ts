import { IsArray, IsUUID } from "class-validator";

export class AdminReplaceProductCollectionsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  collectionIds!: string[];
}
