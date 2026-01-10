import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class AdminReplaceProductCategoriesDto {
  @IsArray()
  @IsUUID("4", { each: true })
  categoryIds!: string[];
}
