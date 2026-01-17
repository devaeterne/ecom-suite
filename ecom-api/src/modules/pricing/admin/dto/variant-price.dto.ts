import { IsInt, IsOptional, IsString, Min, IsBoolean } from "class-validator";

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
export class UpdateVariantPriceDto {
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAt?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
