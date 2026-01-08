import { Type } from "class-transformer";
import { IsArray, IsInt, IsString, Min, ValidateNested } from "class-validator";

export class UpsertInventoryLevelItemDto {
  @IsString()
  locationId!: string;

  @IsString()
  variantId!: string;

  @IsInt()
  @Min(0)
  stockedQuantity!: number;
}

export class UpsertInventoryLevelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertInventoryLevelItemDto)
  items!: UpsertInventoryLevelItemDto[];
}
