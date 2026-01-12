import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  IsBoolean,
  IsObject,
} from "class-validator";

export class AdminCreateVariantDto {
  @ApiPropertyOptional({ maxLength: 255, example: "Default Variant" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional({ example: "SKU-ACME-001" })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: "1234567890123" })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ minimum: 0, example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class AdminVariantUpdateDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsString()
  barcode?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
