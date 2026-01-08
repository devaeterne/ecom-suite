import { IsOptional, IsString, IsUUID, Length, IsIn } from "class-validator";

export class AdminCreateCategoryDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(2, 120)
  handle!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export class AdminUpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  handle?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
export class AdminCategoryListQueryDto {
  @IsOptional()
  @IsIn(["tree", "flat"])
  view?: "tree" | "flat";

  @IsOptional()
  @IsString()
  q?: string;
}
