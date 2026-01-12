import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateVariantPriceDto {
  @IsOptional()
  @IsString()
  priceListId?: string;

  @IsString()
  currencyCode!: string;

  @IsInt()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAt?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number;
}
