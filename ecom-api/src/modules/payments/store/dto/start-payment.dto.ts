// src/modules/payments/store/dto/start-payment.dto.ts
import { IsEnum, IsOptional, IsString, ValidateIf } from "class-validator";

export enum StartPaymentProvider {
  STRIPE = "STRIPE",
  PAYPAL = "PAYPAL",
  VERIFONE = "VERIFONE",
  MANUAL = "MANUAL",
  PAYTR = "PAYTR",
}

export enum ManualPaymentMethodDto {
  PAY_AT_STORE = "PAY_AT_STORE",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export class StartPaymentDto {
  @IsEnum(StartPaymentProvider)
  provider!: StartPaymentProvider;

  // ✅ idempotency: aynı isteğin tekrarı aynı sonucu üretir (özellikle ödeme başlatmada kritik)
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  // ✅ locale: ödeme ekranı / provider tarafı dil/ülke kırılımı için
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @ValidateIf((x) => x.provider === StartPaymentProvider.MANUAL)
  @IsEnum(ManualPaymentMethodDto)
  manualMethod?: ManualPaymentMethodDto;
}
