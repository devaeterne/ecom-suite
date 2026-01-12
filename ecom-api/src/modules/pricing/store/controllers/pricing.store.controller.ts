// src/modules/pricing/store/controllers/pricing.store.controller.ts
import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

import { PricingStoreService } from "../services/pricing.store.service";
import { getTenantIdOrThrow } from "@/modules/cart/common/policies/tenant.policy";
import { PrismaService } from "@/prisma/prisma.service";

import {
  getCartId,
  setCartCookie,
} from "@/modules/cart/common/policies/cart.cookies";
import {
  getPriceListId,
  PRICE_LIST_COOKIE,
} from "@/modules/cart/common/policies/pricing-context";

export class SetCartPriceListDto {
  priceListId!: string | null;
}

function setPriceListCookie(res: Response, priceListId: string | null) {
  if (!priceListId) {
    res.clearCookie(PRICE_LIST_COOKIE, { path: "/" });
    return;
  }

  res.cookie(PRICE_LIST_COOKIE, priceListId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // prod: true
    path: "/",
  });
}

@Controller("/api/store")
export class PricingStoreController {
  constructor(private readonly pricing: PricingStoreService) {}

  /**
   * Debug: unit price çöz
   * GET /api/store/pricing/variant-price?variantId=...&currencyCode=EUR&quantity=3
   * Header optional: x-price-list-id
   */
  @Get("/pricing/variant-price")
  async resolveVariantPrice(
    @Req() req: Request,
    @Query("variantId") variantId: string,
    @Query("currencyCode") currencyCode = "EUR",
    @Query("quantity") quantityRaw = "1"
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const priceListId = getPriceListId(req);
    const quantity = Math.max(1, Number(quantityRaw || 1));

    const unit = await this.pricing.resolveUnitPrice(
      this.pricing.prismaClient as any,
      {
        tenantId,
        cartId: "debug",
        variantId,
        currencyCode,
        quantity,
        priceListId,
      }
    );

    return { priceListId, unit };
  }

  /**
   * POST /api/store/cart/price-list  { priceListId: "..." | null }
   * - cart cookie yoksa da cookie set eder (cart oluşunca devreye girer)
   * - cart varsa metadata'ya da iliştirir (opsiyonel, ama faydalı)
   */
  @Post("/cart/price-list")
  async setCartPriceList(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SetCartPriceListDto
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);

    setPriceListCookie(res, dto.priceListId ?? null);

    if (!cartId) {
      return { ok: true, cartId: null, priceListId: dto.priceListId ?? null };
    }

    await this.pricing.attachPriceListToCart(
      tenantId,
      cartId,
      dto.priceListId ?? null
    );

    setCartCookie(res, cartId);
    return { ok: true, cartId, priceListId: dto.priceListId ?? null };
  }
}
