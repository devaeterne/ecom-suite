import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateFileLinkDto {
  @IsString()
  @IsNotEmpty()
  entityType!: string; // enum FileEntityType

  @IsString()
  @IsNotEmpty()
  entityId!: string;

  @IsString()
  @IsNotEmpty()
  role!: string; // enum FileRole

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;
}
