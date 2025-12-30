import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsBoolean,
} from "class-validator";

export class RolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionKeys!: string[];

  @IsOptional()
  @IsIn(["replace", "merge"])
  mode?: "replace" | "merge";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
