import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateOrderFromCheckoutDto {
  @IsString()
  checkoutId!: string;

  @IsOptional()
  @IsBoolean()
  allowWithoutCapturedPayment?: boolean;
}
