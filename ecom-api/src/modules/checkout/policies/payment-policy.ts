import { PaymentProvider } from "@prisma/client";

export function allowedProvidersByCountry(iso2: string): PaymentProvider[] {
  switch ((iso2 || "").toUpperCase()) {
    case "TR":
      return [PaymentProvider.PAYTR, PaymentProvider.MANUAL];
    case "ME":
      return [PaymentProvider.VERIFONE, PaymentProvider.MANUAL];
    case "DE":
    case "FR":
    case "GB":
    case "US":
      return [PaymentProvider.STRIPE, PaymentProvider.MANUAL];
    default:
      return [PaymentProvider.MANUAL];
  }
}
