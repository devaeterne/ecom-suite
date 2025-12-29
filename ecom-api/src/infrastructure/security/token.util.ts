import { randomBytes } from "crypto";

export function randomTokenUrlSafe(bytes = 32) {
  // URL-safe base64
  return randomBytes(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
