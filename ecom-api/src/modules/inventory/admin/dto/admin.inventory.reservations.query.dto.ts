import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export enum InventoryReservationStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED",
}

function toInt(v: unknown) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export class AdminInventoryReservationsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkoutId?: string;

  @ApiPropertyOptional({ enum: InventoryReservationStatus })
  @IsOptional()
  @IsEnum(InventoryReservationStatus)
  status?: InventoryReservationStatus;

  @ApiPropertyOptional({ example: 50, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  take?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(0)
  skip?: number;
}
