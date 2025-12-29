import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class StoreLoginDto {
  @ApiProperty({ example: "admin@ecomsuite.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "ChangeMe123!" })
  @IsString()
  @MinLength(6)
  password!: string;
}
