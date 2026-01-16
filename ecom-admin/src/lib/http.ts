// src/lib/http.ts
import { getApiBaseUrl } from "./api-base";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  // Cookie tabanli auth icin kritik
  credentials?: RequestCredentials;
};

function joinUrl(base: string, path: string) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function readBody(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (res.status === 204) return null;

  if (isJson) {
    return await res.json().catch(() => null);
  }
  return await res.text().catch(() => null);
}

// ✅ Query helper (liste ekranlari icin pratik)
export function withQuery(path: string, query?: Record<string, any>) {
  if (!query) return path;

  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.set(k, String(v));
  }

  const qs = sp.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const url = joinUrl(base, path);

  const hasBody = opts.body !== undefined && opts.body !== null;

  // Body tipi kontrol: JSON mi, FormData mi, string mi vs.
  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && opts.body instanceof Blob;
  const isArrayBuffer =
    typeof ArrayBuffer !== "undefined" && opts.body instanceof ArrayBuffer;
  const isString = typeof opts.body === "string";

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(opts.headers ?? {}),
  };

  // ✅ content-type sadece JSON body varsa set edilir (FormData bozulmaz)
  const shouldJson =
    hasBody && !isFormData && !isBlob && !isArrayBuffer && !isString;

  if (shouldJson && !("content-type" in headers)) {
    headers["content-type"] = "application/json";
  }

  const body: BodyInit | undefined = !hasBody
    ? undefined
    : isFormData || isBlob || isArrayBuffer || isString
    ? (opts.body as any)
    : JSON.stringify(opts.body);

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body,
    signal: opts.signal,
    // ✅ login cookie set icin sart
    credentials: opts.credentials ?? "include",
  });

  const data = await readBody(res);

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      (data as any)?.detail ||
      (data as any)?.error ||
      `Request failed: ${res.status}`;
    throw new HttpError(msg, res.status, data);
  }

  return data as T;
}

// Opsiyonel: minik sugar (kodu temiz tutar)
export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...(opts ?? {}), method: "GET" }),
  post: <T>(
    path: string,
    body?: any,
    opts?: Omit<RequestOptions, "method" | "body">
  ) => apiFetch<T>(path, { ...(opts ?? {}), method: "POST", body }),
  put: <T>(
    path: string,
    body?: any,
    opts?: Omit<RequestOptions, "method" | "body">
  ) => apiFetch<T>(path, { ...(opts ?? {}), method: "PUT", body }),
  patch: <T>(
    path: string,
    body?: any,
    opts?: Omit<RequestOptions, "method" | "body">
  ) => apiFetch<T>(path, { ...(opts ?? {}), method: "PATCH", body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiFetch<T>(path, { ...(opts ?? {}), method: "DELETE" }),
};
