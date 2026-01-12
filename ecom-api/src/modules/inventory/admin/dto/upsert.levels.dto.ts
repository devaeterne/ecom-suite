// src/modules/inventory/admin/dto/upsert.levels.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsString, Min, ValidateNested } from "class-validator";

export class UpsertInventoryLevelItemDto {
  @ApiProperty({ example: "c6c9b8a2-9b0b-4d65-9f6e-9d4e9a6a1111" })
  @IsString()
  locationId!: string;

  @ApiProperty({ example: "f2b2b8a2-9b0b-4d65-9f6e-9d4e9a6a2222" })
  @IsString()
  variantId!: string;

  @ApiProperty({ example: 25, minimum: 0 })
  @IsInt()
  @Min(0)
  stockedQuantity!: number;
}

export class UpsertInventoryLevelsDto {
  @ApiProperty({ type: [UpsertInventoryLevelItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertInventoryLevelItemDto)
  items!: UpsertInventoryLevelItemDto[];
}
