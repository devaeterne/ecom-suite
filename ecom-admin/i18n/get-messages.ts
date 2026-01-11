import type { Locale } from "./config";

export async function getMessages(locale: Locale) {
  // JSON import’larını dinamik yapıyoruz
  switch (locale) {
    case "tr":
      return (await import("@/messages/tr.json")).default;
    case "en":
    default:
      return (await import("@/messages/en.json")).default;
  }
}
