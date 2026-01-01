import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class StoreRegisterDto {
  @ApiProperty({ example: "buyer1@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Passw0rd!" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: "Buyer" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: "One" })
  @IsOptional()
  @IsString()
  lastName?: string;
}
