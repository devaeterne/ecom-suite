import { IsEnum, IsString, IsOptional } from "class-validator";
import { PaymentProvider } from "@prisma/client";

export class StorePaymentDto {
  @IsString()
  checkoutId!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsString()
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}
