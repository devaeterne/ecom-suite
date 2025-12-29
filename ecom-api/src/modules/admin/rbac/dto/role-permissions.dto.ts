import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class RolePermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionKeys!: string[];
}
