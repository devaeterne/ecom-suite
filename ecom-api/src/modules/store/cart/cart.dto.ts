import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateCartDto {
  @IsOptional()
  @IsString()
  email?: string;
}

export class AddLineItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateLineItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class ApplyCouponDto {
  @IsString()
  code!: string;
}

export class SetShippingMethodDto {
  @IsString()
  shippingOptionId!: string;
}
