import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsEnum, IsOptional } from "class-validator";

export enum PasswordResetTyp {
  ADMIN = "admin",
  STORE = "store",
}
export class ResetRequestDto {
  @ApiProperty({ example: "admin@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: PasswordResetTyp,
    required: false,
    default: PasswordResetTyp.ADMIN,
  })
  @IsOptional()
  @IsEnum(PasswordResetTyp)
  typ?: PasswordResetTyp;
}
