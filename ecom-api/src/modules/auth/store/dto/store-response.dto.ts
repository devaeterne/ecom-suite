import { ApiProperty } from "@nestjs/swagger";

export class StoreResponseDto {
  @ApiProperty()
  accessToken!: string;
}
