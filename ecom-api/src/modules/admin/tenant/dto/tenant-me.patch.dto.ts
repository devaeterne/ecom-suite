import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class TenantDomainsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  domains?: string[];
}

export class TenantBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}

export class TenantI18nDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  locale?: string; // "tr-TR"

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string; // "TRY"
}

export class TenantMePatchDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TenantBrandingDto)
  branding?: TenantBrandingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantI18nDto)
  i18n?: TenantI18nDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantDomainsDto)
  domains?: TenantDomainsDto;
}
