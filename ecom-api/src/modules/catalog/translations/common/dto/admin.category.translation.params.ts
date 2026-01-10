import { IsString } from "class-validator";

export class CategoryTranslationParams {
  @IsString()
  categoryId!: string;

  @IsString()
  localeCode!: string;
}
