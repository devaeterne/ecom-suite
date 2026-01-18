import { Controller, Get, Query, Req, Res, Post, Body } from "@nestjs/common";
import type { Request, Response } from "express";

import { PricingStoreService } from "../services/pricing.store.service";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";
import { baseCookieOptions } from "@/infrastructure/http/cookies";

import {
  getPriceListId,
  PRICE_LIST_COOKIE,
} from "@/modules/cart/common/policies/pricing-context";

export class SetCartPriceListDto {
  priceListId!: string | null;
}

function setPriceListCookie(res: Response, priceListId: string | null) {
  if (!priceListId) {
    res.clearCookie(PRICE_LIST_COOKIE, baseCookieOptions());
    return;
  }

  res.cookie(PRICE_LIST_COOKIE, priceListId, baseCookieOptions());
}

@Controller("/store")
export class PricingStoreController {
  constructor(private readonly pricing: PricingStoreService) {}

  @Get("/pricing/variant-price")
  async resolveVariantPrice(
    @Req() req: Request,
    @Query("variantId") variantId: string,
    @Query("currencyCode") currencyCode = "EUR",
    @Query("quantity") quantityRaw = "1",
  ) {
    const tenantId = requireTenantId(req);
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
      },
    );

    return { priceListId, unit };
  }

  // Bu blok şu an comment içinde; açacaksan burada dursun:
  /*
  @Post("/cart/price-list")
  async setCartPriceList(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SetCartPriceListDto,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);

    setPriceListCookie(res, dto.priceListId ?? null);

    if (!cartId) {
      return { ok: true, cartId: null, priceListId: dto.priceListId ?? null };
    }

    await this.pricing.attachPriceListToCart(
      tenantId,
      cartId,
      dto.priceListId ?? null,
    );

    setCartCookie(res, cartId);
    return { ok: true, cartId, priceListId: dto.priceListId ?? null };
  }
  */
}
