import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class StoreRegisterDto {
  @ApiProperty({ example: "jane@domain.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "ChangeMe123!" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "Jane", required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: "Doe", required: false })
  @IsOptional()
  @IsString()
  lastName?: string;
}
