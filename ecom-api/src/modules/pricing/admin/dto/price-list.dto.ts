import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
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
}
