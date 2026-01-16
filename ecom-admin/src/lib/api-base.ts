// src/lib/api-base.ts

/**
 * Client & Server uyumlu API base resolver
 */
export function getApiBaseUrl(): string {
  // Browser (Client Component)
  if (typeof window !== "undefined") {
    // Next.js build-time inject eder
    return (
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"
    ).replace(/\/$/, "");
  }

  // Server (SSR / route handlers / middleware dışı)
  return (
    process.env.API_URL_INTERNAL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3001"
  ).replace(/\/$/, "");
}
