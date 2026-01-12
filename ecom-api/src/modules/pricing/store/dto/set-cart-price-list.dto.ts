import { IsOptional, IsUUID, ValidateIf } from "class-validator";

export class SetCartPriceListDto {
  // null göndermek için alanı tamamen boş geçebilirsin; service null’a çeker
  @IsOptional()
  @ValidateIf((o) => o.priceListId !== null && o.priceListId !== undefined)
  @IsUUID()
  priceListId?: string | null;
}
