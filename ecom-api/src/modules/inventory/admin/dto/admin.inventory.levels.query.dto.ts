import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class AdminInventoryLevelsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  take?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
