import type {
  CustomerMe,
  CustomerAddressDTO,
} from "@/modules/customers/common/types/customer.types";

const iso = (d: any) =>
  d instanceof Date ? d.toISOString() : new Date(d ?? 0).toISOString();

export function toCustomerMe(row: any): CustomerMe {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    phone: row.phone ?? null,
    createdAt: iso(row.createdAt),
  };
}

export function toCustomerAddressDTO(row: any): CustomerAddressDTO {
  return {
    id: row.id,

    title: row.label ?? null,
    fullName: row.fullName ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    company: row.company ?? null,

    address1: row.line1,
    address2: row.line2 ?? null,
    city: row.city,
    district: row.province ?? null,
    zip: row.postalCode ?? null,
    countryIso2: row.countryIso2,

    isDefault: Boolean(row.isDefault),

    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}
