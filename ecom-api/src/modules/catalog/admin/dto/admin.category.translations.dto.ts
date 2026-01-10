import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminCreateCategoryTranslationDto {
  @IsString()
  @MaxLength(16)
  localeCode!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class AdminUpdateCategoryTranslationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
