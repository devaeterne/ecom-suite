import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class RequestRefundDto {
  @IsUUID()
  orderId!: string;

  @IsInt()
  @Min(1)
  amountTotal!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
