import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { ProductMediaRole } from "@prisma/client";

export class AdminAttachProductMediaDto {
  @IsUUID()
  fileId!: string;

  @IsOptional()
  role?: ProductMediaRole; // GALLERY | THUMBNAIL | HERO

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rank?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AdminUpdateProductMediaDto {
  @IsOptional()
  role?: ProductMediaRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rank?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AdminReorderProductMediaDto {
  @IsArray()
  @IsUUID("4", { each: true })
  orderedIds!: string[];
}
