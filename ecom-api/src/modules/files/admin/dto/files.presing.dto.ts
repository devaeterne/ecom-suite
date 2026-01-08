import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreatePresignedUploadDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsOptional()
  @IsString()
  folder?: string; // opsiyonel (örn: "products")
}
