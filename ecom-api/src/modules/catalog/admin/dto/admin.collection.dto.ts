import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Prisma } from "@prisma/client";

export class AdminCreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  handle!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AdminUpdateCollectionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  handle?: string;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.JsonObject;
}

/**
 * Minimal list query:
 * - q: title/handle search (contains, insensitive)
 * - limit/offset: basit pagination
 *
 * Projedeki PaginationDto’n varsa bunu extend edebilirsin.
 */
export class AdminListCollectionsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;
}
