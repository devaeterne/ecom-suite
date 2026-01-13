import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { RoleScope } from "@prisma/client";

export class RoleCreateDto {
  @ApiProperty({
    example: "QA",
    maxLength: 80,
    description: "Role name (unique within tenant, if you enforce it).",
  })
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({
    enum: RoleScope,
    example: RoleScope.STAFF, // enumda ne varsa ona göre
    description: "Role scope (Prisma RoleScope enum). Optional.",
  })
  @IsOptional()
  @IsEnum(RoleScope)
  scope?: RoleScope;

  @ApiPropertyOptional({
    example: "Quality Assurance role for internal staff",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
