import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { RoleScope } from "@prisma/client";

export class RoleCreateDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEnum(RoleScope)
  scope?: RoleScope;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
