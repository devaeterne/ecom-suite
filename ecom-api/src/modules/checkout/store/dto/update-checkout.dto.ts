import { IsOptional, IsString } from "class-validator";

export class UpdateCheckoutDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
