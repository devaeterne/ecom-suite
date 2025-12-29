import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MinLength } from "class-validator";

export class ResetConfirmDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({ enum: ["admin", "store"], example: "admin" })
  @IsIn(["admin", "store"])
  typ!: "admin" | "store";
}
