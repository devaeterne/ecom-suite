import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ShippingProfileType, ShippingProvider } from "@prisma/client";

export class ShippingCarrierDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;

  @ApiProperty({
    nullable: true,
    description: "Provider key: SHIPPO/EASYPOST/MANUAL/...",
  })
  provider!: string | null;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ShippingProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ShippingProfileType })
  type!: ShippingProfileType;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ShippingOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  profileId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ShippingProvider })
  provider!: ShippingProvider;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true, example: 599 })
  amount!: number | null;

  @ApiProperty({ example: "EUR" })
  currencyCode!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
