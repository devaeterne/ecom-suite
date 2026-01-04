import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

/**
 * Role PATCH DTO
 * - Kısmi güncelleme için kullanılır
 * - name / description / isActive opsiyonel
 */
export class RolePatchDto {
  @IsOptional()
  @IsString()
  @Length(2, 64)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
