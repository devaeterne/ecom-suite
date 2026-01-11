import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { ShippingProfileType } from "@prisma/client";

export class AdminCreateShippingProfileDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(ShippingProfileType)
  type?: ShippingProfileType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AdminPatchShippingProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ShippingProfileType)
  type?: ShippingProfileType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
