import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ArrayNotEmpty,
  IsArray,
  IsUUID,
} from "class-validator";
import { Prisma } from "@prisma/client";

export class AdminCreateTagDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.JsonObject;
}

export class AdminUpdateTagDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  value?: string;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.JsonObject;
}

export class AdminListTagsQueryDto {
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
  limit?: number = 50;
}

export class AdminReplaceProductTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("4", { each: true })
  tagIds!: string[];
}
