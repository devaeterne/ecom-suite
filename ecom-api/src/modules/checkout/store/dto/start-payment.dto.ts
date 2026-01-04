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

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  // ✅ burası TS hatalarını kapatır + idempotency stratejine uyar
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  // ✅ ödeme provider'ları için pratik
  @IsOptional()
  @IsString()
  locale?: string;

  @ValidateIf((x) => x.provider === StartPaymentProvider.MANUAL)
  @IsEnum(ManualPaymentMethodDto)
  manualMethod?: ManualPaymentMethodDto;
}
