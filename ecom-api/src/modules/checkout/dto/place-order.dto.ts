import { IsOptional, IsString, IsUUID } from "class-validator";

export class PlaceOrderDto {
  // Verifone intent id vs.
  @IsOptional()
  @IsString()
  paymentExternalRef?: string;

  // şimdilik sadece allow; reservation zaten locationId ile geliyor.
  @IsOptional()
  @IsUUID()
  pickupLocationId?: string;
}
