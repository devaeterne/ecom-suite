import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { FulfillmentStatus } from "@prisma/client";

class CreateFullfilmentItemDto {
  @IsUUID()
  orderLineItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateFullfilmentDto {
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  status?: FulfillmentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFullfilmentItemDto)
  items!: CreateFullfilmentItemDto[];

  @IsOptional()
  @IsUUID()
  carrierId?: string;

  @IsOptional()
  @IsString()
  trackingNo?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
