// src/modules/cart/common/policies/cart.cookies.ts
import type { Request, Response } from "express";

export const STORE_CART_COOKIE = "ecom_cart";

export function getCartId(req: any): string | null {
  return (req?.cookies?.[STORE_CART_COOKIE] as string | undefined) ?? null;
}

export function setCartCookie(res: Response, cartId: string) {
  res.cookie(STORE_CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // prod: true (HTTPS)
    path: "/",
  });
}

export function clearCartCookie(res: Response) {
  res.clearCookie(STORE_CART_COOKIE, { path: "/" });
}
