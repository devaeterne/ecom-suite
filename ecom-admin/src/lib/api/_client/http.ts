// src/lib/api/_client/http.ts
import { getApiBaseUrl } from "@/src/lib/api-base";
import { AdminAuthApi } from "@/src/lib/api/auth/admin";
import { withTenantHeaders } from "@/src/lib/api/_client/tenant";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export class HttpError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

export type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;

  /**
   * Cookie tabanlı auth için:
   * - admin/store login
   * - refresh
   * - session bazlı auth
   */
  credentials?: RequestCredentials;
};

function isIdempotent(method?: HttpMethod) {
  const m = (method ?? "GET").toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

function isRefreshUrl(url: string) {
  return url.includes("/api/admin/auth/refresh");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const doRequest = async () => {
    const method = options.method ?? "GET";

    const headers = withTenantHeaders({
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    });

    const res = await fetch(url, {
      method,
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: options.credentials ?? "include",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    const data = isJson
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);

    return { res, data };
  };

  // 1) İlk deneme
  let { res, data } = await doRequest();

  // 2) 401 -> idempotent ise 1 kere refresh + retry
  const shouldTryRefresh =
    res.status === 401 && isIdempotent(options.method) && !isRefreshUrl(url);

  if (shouldTryRefresh) {
    try {
      await AdminAuthApi.refresh(); // bunun da credentials include kullandığından emin ol
      ({ res, data } = await doRequest());
    } catch {
      // refresh patlarsa normal error akacak
    }
  }

  if (!res.ok) {
    console.error("[apiFetch] FAIL", {
      url,
      method: options.method ?? "GET",
      status: res.status,
      data,
    });

    const message =
      (data as any)?.message ||
      (data as any)?.detail ||
      `Request failed with status ${res.status}`;

    throw new HttpError(message, res.status, data);
  }

  return data as T;
}
