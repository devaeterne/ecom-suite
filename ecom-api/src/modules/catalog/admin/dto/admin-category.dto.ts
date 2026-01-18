import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  IsIn,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
export class AdminCategoryListQueryDto {
  @IsOptional()
  @IsIn(["tree", "flat"])
  view?: "tree" | "flat";

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === false) return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined; // gelmediyse
  })
  @IsBoolean()
  isActive?: boolean;
}
