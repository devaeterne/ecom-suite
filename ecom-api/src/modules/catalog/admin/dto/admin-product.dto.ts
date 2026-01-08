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
import { Type } from "class-transformer";

class AdminVariantDto {
  @IsString()
  @Length(2, 180)
  title!: string;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsString()
  barcode?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminCreateProductDto {
  @IsString()
  @Length(2, 180)
  title!: string;

  @IsString()
  @Length(2, 180)
  handle!: string;

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
