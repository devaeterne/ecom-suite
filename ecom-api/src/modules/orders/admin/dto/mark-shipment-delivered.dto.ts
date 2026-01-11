import { IsOptional, IsISO8601 } from "class-validator";

export class MarkShipmentDeliveredDto {
  // opsiyonel: deliveredAt override
  @IsOptional()
  @IsISO8601()
  deliveredAt?: string;
}
