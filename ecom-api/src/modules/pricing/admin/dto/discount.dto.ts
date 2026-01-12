import { DiscountType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateDiscountDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsEnum(DiscountType)
  type!: DiscountType;

  @IsInt()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotal?: number;
}
