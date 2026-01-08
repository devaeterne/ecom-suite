import { IsString, MaxLength } from "class-validator";

export class AdminCreateOptionDto {
  @IsString()
  @MaxLength(100)
  title!: string;
}

export class AdminAddOptionValueDto {
  @IsString()
  @MaxLength(100)
  value!: string;
}
