import { IsOptional, IsString, IsObject } from "class-validator";

export class TenantMePatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsObject()
  domains?: {
    admin?: string;
    storefront?: string;
    api?: string;
  };
}
