import { IsInt, IsNotEmpty, IsPositive, IsString, Min } from "class-validator";

export class AdminCreateFileDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @IsPositive()
  @Min(1)
  size!: number;
}
