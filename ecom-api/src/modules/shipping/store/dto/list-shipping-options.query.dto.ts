import { IsOptional, IsString } from "class-validator";

export class ListShippingOptionsQueryDto {
  @IsOptional()
  @IsString()
  profileId?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
