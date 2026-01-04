import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export enum AdminRoleScopeDto {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

export class IdentityCreateDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(AdminRoleScopeDto)
  roleScope?: AdminRoleScopeDto; // default STAFF
}
