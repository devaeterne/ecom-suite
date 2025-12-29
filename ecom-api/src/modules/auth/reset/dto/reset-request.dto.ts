import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn } from "class-validator";

export class ResetRequestDto {
  @ApiProperty({ example: "admin@acme.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ["admin", "store"], example: "admin" })
  @IsIn(["admin", "store"])
  typ!: "admin" | "store";
}
