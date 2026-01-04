// src/modules/customers/common/constants/customer.constants.ts

export const CUSTOMER_DEFAULT_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const CUSTOMER_ADDRESS_DEFAULT_ORDER = [
  { isDefault: "desc" as const },
  { createdAt: "desc" as const },
];

export const CUSTOMER_ERRORS = {
  UNAUTHENTICATED: "Unauthenticated",
  TENANT_NOT_RESOLVED: "Tenant not resolved",
  CUSTOMER_NOT_FOUND: "Customer not found",
  ADDRESS_NOT_FOUND: "Address not found",
  COUNTRY_MISSING: "countryIso2 missing",
} as const;
