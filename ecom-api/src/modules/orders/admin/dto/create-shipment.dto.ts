import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsObject,
} from "class-validator";
import { ShipmentStatus } from "@prisma/client";

export class CreateShipmentDto {
  /**
   * Shipment -> OrderFulfillment relation
   */
  @IsUUID()
  orderFulfillmentId!: string;

  /**
   * Shipment -> ShippingCarrier relation
   */
  @IsUUID()
  carrierId!: string;

  /**
   * Opsiyonel: CREATED default zaten şemada var.
   * Admin override isterse diye açık.
   */
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  labelUrl?: string;

  @IsOptional()
  @IsString()
  providerShipmentId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
