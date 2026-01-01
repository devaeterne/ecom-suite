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

  @IsOptional()
  @IsString()
  currencyCode?: string;
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
 * - testlerin gönderdiği flat alanları kabul eder: { name, logoUrl, locale, currencyCode, domains }
 * - ileride UI için nested structure da kabul eder: { branding, i18n, domains }
 */
export class TenantMePatchDto {
  // ---- flat (minimal patch / legacy)
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
