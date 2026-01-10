import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminCreateProductTranslationDto {
  @IsString()
  @MaxLength(16)
  localeCode!: string; // tr, en, tr-TR

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsString()
  searchKeywords?: string | null;
}

export class AdminUpdateProductTranslationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  seoDescription?: string | null;

  @IsOptional()
  @IsString()
  searchKeywords?: string | null;
}
