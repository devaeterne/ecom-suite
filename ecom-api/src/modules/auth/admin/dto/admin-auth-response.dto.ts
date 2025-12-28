import { ApiProperty } from "@nestjs/swagger";

export class AdminAuthResponseDto {
  @ApiProperty()
  accessToken!: string;
}
