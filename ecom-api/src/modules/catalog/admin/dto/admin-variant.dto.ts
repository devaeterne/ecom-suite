import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from "class-validator";

export class AdminCreateVariantDto {
  @ApiPropertyOptional({ example: "Default" })
  @IsOptional()
  @IsString()
  @Length(2, 180)
  title?: string;

  @ApiPropertyOptional({ example: "SKU-123", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sku?: string | null;

  @ApiPropertyOptional({ example: "1234567890", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  barcode?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AdminVariantUpdateDto extends AdminCreateVariantDto {}
