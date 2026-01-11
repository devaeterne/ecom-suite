import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class AdminCreateShippingCarrierDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  metadata?: Record<string, unknown>;
}

export class AdminPatchShippingCarrierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  provider?: string;
  @IsOptional()
  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  metadata?: Record<string, unknown>;
}
