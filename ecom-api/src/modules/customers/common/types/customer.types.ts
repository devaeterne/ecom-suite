export type CustomerMe = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
};

export type CustomerAddressDTO = {
  id: string;

  // UI/Client contract (DTO’ların dili)
  title: string | null; // label
  fullName: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;

  address1: string; // line1
  address2: string | null; // line2
  city: string;
  district: string | null; // province
  zip: string | null; // postalCode
  countryIso2: string;

  isDefault: boolean;

  createdAt: string;
  updatedAt: string;
};
