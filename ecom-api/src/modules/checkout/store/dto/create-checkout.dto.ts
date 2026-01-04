import { IsEmail, IsOptional, IsString, IsUUID, Length } from "class-validator";

export class CreateCheckoutDto {
  @IsOptional()
  @IsUUID()
  cartId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
