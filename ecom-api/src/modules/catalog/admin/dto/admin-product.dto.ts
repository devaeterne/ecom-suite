import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer"; // ✅ burası kritik

class AdminVariantDto {
  @ApiProperty({ example: "Default" })
  @IsString()
  @Length(2, 180)
  title!: string;

  @ApiPropertyOptional({ example: "SKU-123", nullable: true })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: "1234567890", nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminCreateProductDto {
  @ApiProperty()
  @IsString()
  @Length(2, 180)
  title!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 180)
  handle!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ enum: ["draft", "published", "archived"] })
  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  collectionIds?: string[];

  @ApiPropertyOptional({ type: [AdminVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminVariantDto)
  variants?: AdminVariantDto[];
}

export class AdminUpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(2, 180)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(2, 180)
  handle?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: "draft" | "published" | "archived";

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  collectionIds?: string[];
}

export class AdminProductListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
