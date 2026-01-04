import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform } from "class-transformer";
import { OrderStatus } from "@prisma/client";

const toInt = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export class ListOrdersQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(OrderStatus) as any)
  status?: OrderStatus;

  // şimdilik smoke için opsiyonel bırakalım.
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  minTotal?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  maxTotal?: number;

  @IsOptional()
  @IsString()
  fromDate?: string; // ISO

  @IsOptional()
  @IsString()
  toDate?: string; // ISO
}
