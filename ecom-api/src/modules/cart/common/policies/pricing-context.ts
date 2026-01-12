import type { Request, Response } from "express";

/**
 * PriceList context:
 * - Header: x-price-list-id | x-pricelist-id
 * - Cookie: ecom_plid
 *
 * Not: Express Request’te req.get / req.header kullanabilirsin ama
 * bazı wrapper’larda bozulabiliyor; headers map + cookies en deterministik.
 */
export const PRICE_LIST_COOKIE = "ecom_plid";

export function getPriceListId(req: Request): string | null {
  const headerVal =
    (req?.headers?.["x-price-list-id"] as string | undefined) ??
    (req?.headers?.["x-pricelist-id"] as string | undefined);

  const cookieVal = (req as any)?.cookies?.[PRICE_LIST_COOKIE] as
    | string
    | undefined;

  return headerVal ?? cookieVal ?? null;
}

export function setPriceListCookie(res: Response, priceListId: string | null) {
  if (!priceListId) {
    res.clearCookie(PRICE_LIST_COOKIE, { path: "/" });
    return;
  }

  res.cookie(PRICE_LIST_COOKIE, priceListId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // prod: true (https)
    path: "/",
    maxAge: 1000 * 60 * 60 * 24, // 24h
  });
}
