import { IsOptional, IsUUID, IsString, MaxLength } from "class-validator";

export class ReserveStockDto {
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  idempotencyKey?: string;
}

export class ReleaseStockDto {
  @IsOptional()
  @IsUUID()
  locationId?: string;
}
