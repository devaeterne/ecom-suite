import {
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class TenantBrandingPatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class TenantI18nPatchDto {
  @IsOptional()
  @IsString()
  locale?: string;
}

export class TenantDomainsPatchDto {
  @IsOptional()
  @IsString()
  admin?: string;

  @IsOptional()
  @IsString()
  storefront?: string;

  @IsOptional()
  @IsString()
  api?: string;
}

/**
 * Backward-compatible PATCH DTO:
 * - flat: { name, logoUrl, timezone, currencyCode, locale, domains }
 * - nested: { branding, i18n, domains }
 */
export class TenantMePatchDto {
  // ---- flat (legacy + minimal patch)
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  // ✅ metadata.top-level
  @IsOptional()
  @IsString()
  timezone?: string;

  // ✅ metadata.top-level
  @IsOptional()
  @IsString()
  currencyCode?: string;

  // locale’ı ister flat ister nested kabul ediyoruz
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsObject()
  domains?: TenantDomainsPatchDto;

  // ---- nested (preferred)
  @IsOptional()
  @ValidateNested()
  @Type(() => TenantBrandingPatchDto)
  branding?: TenantBrandingPatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantI18nPatchDto)
  i18n?: TenantI18nPatchDto;
}
