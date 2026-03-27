// src/lib/api/_client/http.ts
import { getApiBaseUrl } from "@/src/lib/api-base";
import { AdminAuthApi, AdminMeApi } from "@/src/lib/api/auth/admin";
import {
  getTenantHeaders,
  clearTenantContext,
} from "@/src/lib/api/_client/tenant";

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

/**
 * auth:
 * - admin: credentials include + 401 refresh retry
 * - store: credentials include (ileride store refresh eklersin)
 * - none: default behavior
 *
 * tenant:
 * - true: withTenantHeaders uygula
 * - false: tenant header basma
 */
export type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;

  credentials?: RequestCredentials;

  auth?: "admin" | "store" | "none";
  tenant?: boolean;
};

function toAbsUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getApiBaseUrl();
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

function isIdempotent(method?: HttpMethod) {
  const m = (method ?? "GET").toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

function isRefreshUrl(url: string) {
  return url.includes("/api/admin/auth/refresh");
}

function shouldJsonifyBody(body: unknown) {
  // File/FormData gibi durumları bozmayalım
  if (body === undefined || body === null) return false;
  if (typeof body === "string") return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer)
    return false;
  return true;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = toAbsUrl(path);

  const method = options.method ?? "GET";
  const auth = options.auth ?? "none";

  // admin için default tenant=true, diğerlerinde default=true (mevcut davranışınla uyumlu)
  const tenantEnabled = options.tenant ?? true;

  const doRequest = async () => {
    const baseHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers ?? {}),
    };

    // body JSON ise content-type ekle
    const hasJsonBody = shouldJsonifyBody(options.body);
    if (hasJsonBody) baseHeaders["Content-Type"] = "application/json";

    const headers = tenantEnabled
      ? { ...getTenantHeaders(), ...baseHeaders } // ✅ caller override eder
      : baseHeaders;

    const res = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : hasJsonBody
            ? JSON.stringify(options.body)
            : (options.body as any),
      signal: options.signal,

      // admin/store cookie default include (senin mevcut davranışınla uyumlu)
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

  // 2) 401 -> refresh + retry
  // - admin için: idempotent ise retry yap (safe)
  // - refresh endpointine loop yok
  const shouldTryRefresh =
    auth === "admin" &&
    res.status === 401 &&
    isIdempotent(method) &&
    !isRefreshUrl(url);

  if (shouldTryRefresh) {
    try {
      await AdminAuthApi.refresh();
      ({ res, data } = await doRequest());
    } catch {
      AdminMeApi.invalidate();
      clearTenantContext();
    }
  }

  if (!res.ok) {
    console.error("[apiFetch] FAIL", {
      url,
      method,
      status: res.status,
      code: (data as any)?.code,
      message: (data as any)?.message,
      details: (data as any)?.details,
      data,
    });

    const message =
      (data as any)?.message ||
      (data as any)?.detail ||
      (data as any)?.error ||
      `Request failed with status ${res.status}`;

    throw new HttpError(message, res.status, data);
  }

  return data as T;
}
