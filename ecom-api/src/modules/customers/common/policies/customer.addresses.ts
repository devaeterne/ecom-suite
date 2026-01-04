// src/modules/customers/common/policies/customer.addresses.ts
import { BadRequestException } from "@nestjs/common";
import { UpsertAddressDto } from "@/modules/customers/store/dto/upsert-address.dto";
import { CUSTOMER_ERRORS } from "@/modules/customers/common/constants/customer.constants";

/**
 * DTO -> Prisma CustomerAddress mapping
 * DTO: title/address1/address2/district/zip/countryIso2
 * DB : label/line1/line2/province/postalCode/countryIso2
 *
 * Not: Eski client'lar country/countryIso2 alanını farklı gönderebiliyor.
 */
export function mapUpsertAddressDtoToPrisma(dto: UpsertAddressDto) {
  const anyDto = dto as any;

  const countryIso2 =
    dto.countryIso2 ?? anyDto.countryIso2 ?? anyDto.country ?? null;

  if (!countryIso2) {
    throw new BadRequestException(CUSTOMER_ERRORS.COUNTRY_MISSING);
  }

  const line1 = anyDto.address1 ?? anyDto.line1;
  if (!line1 || typeof line1 !== "string") {
    throw new BadRequestException("address1 (line1) is required");
  }

  return {
    // label/title
    label: anyDto.title ?? anyDto.label ?? null,

    fullName: dto.fullName ?? null,
    phone: dto.phone ?? null,
    email: anyDto.email ?? null,
    company: anyDto.company ?? null,

    line1,
    line2: anyDto.address2 ?? anyDto.line2 ?? null,

    city: anyDto.city ?? null,
    province: anyDto.district ?? anyDto.province ?? null,

    postalCode: anyDto.zip ?? anyDto.postalCode ?? null,
    countryIso2,

    isDefault: dto.isDefault ?? false,
  };
}
