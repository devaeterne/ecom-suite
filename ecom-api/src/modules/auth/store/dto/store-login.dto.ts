import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class StoreLoginDto {
  @ApiProperty({ example: "buyer1@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Passw0rd!" })
  @IsString()
  @MinLength(6)
  password!: string;
}
