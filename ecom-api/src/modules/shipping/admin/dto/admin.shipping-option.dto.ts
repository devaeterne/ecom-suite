import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { ShippingProvider } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AdminCreateShippingOptionDto {
  /**
   * profileId'yi body'de değil path'te alacağız:
   * POST /api/admin/shipping/profiles/:profileId/options
   */

  @IsString()
  name!: string;

  @IsEnum(ShippingProvider)
  provider!: ShippingProvider;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AdminPatchShippingOptionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ShippingProvider)
  provider?: ShippingProvider;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
export class ShippingCarrierDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  code?: string | null;

  @ApiPropertyOptional()
  provider?: string | null;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, unknown>;
}

export class ShippingProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, unknown>;
}

export class ShippingOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  profileId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ShippingProvider })
  provider!: ShippingProvider;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional()
  amount?: number | null;

  @ApiProperty()
  currencyCode!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, unknown>;
}
