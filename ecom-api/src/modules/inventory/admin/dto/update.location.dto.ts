import { IsOptional, IsString, IsObject } from "class-validator";

export class UpdateInventoryLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string | null;

  @IsOptional()
  @IsObject()
  address?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
