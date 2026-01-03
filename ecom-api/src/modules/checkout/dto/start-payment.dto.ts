import { IsEnum, IsOptional, IsString, IsUrl } from "class-validator";
import { PaymentProvider } from "@prisma/client";

export class StartPaymentDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  // provider tarafına gidecek opsiyonel return url vb.
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}
