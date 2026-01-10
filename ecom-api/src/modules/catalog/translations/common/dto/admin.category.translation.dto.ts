import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertCategoryTranslationDto {
  @IsString()
  categoryId!: string;

  @IsString()
  localeCode!: string;

  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
