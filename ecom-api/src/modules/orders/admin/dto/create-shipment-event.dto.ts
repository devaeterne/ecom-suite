import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { ShipmentStatus, TrackingEventType } from "@prisma/client";

export class CreateShipmentEventDto {
  @IsEnum(TrackingEventType)
  type!: TrackingEventType;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsObject()
  raw?: Record<string, unknown>;

  // string olarak gelsin; service tarafında new Date(dto.occurredAt)
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
