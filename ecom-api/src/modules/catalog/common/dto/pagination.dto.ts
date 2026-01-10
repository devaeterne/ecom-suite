import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  Max,
  Min,
  IsString,
  MaxLength,
} from "class-validator";

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
export class StoreLocaleQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  localeCode?: string;
}
