import { ApiProperty } from "@nestjs/swagger";

export class StoreAuthResponseDto {
  @ApiProperty()
  accessToken!: string;
}
