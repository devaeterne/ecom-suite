// src/lib/api/_client/query.ts

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | (string | number | boolean)[];

export type QueryParams = Record<string, QueryValue>;

/**
 * /api/admin/products + { q: "shoe", take: 20 }
 * => /api/admin/products?q=shoe&take=20
 */
export function withQuery(path: string, params?: QueryParams): string {
  if (!params || Object.keys(params).length === 0) return path;

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const v of value) {
        search.append(key, String(v));
      }
    } else {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  if (!qs) return path;

  return `${path}?${qs}`;
}
