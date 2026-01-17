import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsISO8601,
  IsUUID,
} from "class-validator";
import { PriceListType } from "@prisma/client";

export class CreatePriceListDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsEnum(PriceListType)
  type?: PriceListType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
  @IsOptional()
  @IsUUID()
  priceListId?: string | null;
}
export class UpdatePriceListDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(PriceListType)
  type?: PriceListType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // opsiyonel: kampanya pencerelemesi
  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}
