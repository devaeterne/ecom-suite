import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { env } from "@/config/env";
import { baseCookieOptions } from "@/infrastructure/http/cookies"; // export etmen lazım

import { STORE_CART_COOKIE } from "@/modules/cart/common/constants/cart.constants";
import {
  CreateCartDto,
  AddLineItemDto,
  ApplyCouponDto,
  SetShippingMethodDto,
} from "@/modules/cart/store/dto/cart.dto";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";
import { StoreCartService } from "@/modules/cart/store/services/cart.service";
import { cartToResponseDto } from "@/modules/cart/common/mappers/cart.mappers";

import {
  getPriceListId,
  setPriceListCookie,
} from "@/modules/cart/common/policies/pricing-context";
import { PricingStoreService } from "@/modules/pricing/store/services/pricing.store.service";
import { UseGuards } from "@nestjs/common";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";

function setCartCookie(res: Response, cartId: string) {
  res.cookie(
    STORE_CART_COOKIE,
    cartId,
    baseCookieOptions({ maxAge: 1000 * 60 * 60 * 24 * 30 }),
  );
}

function getCartId(req: Request): string | null {
  const anyReq = req as any;
  const v =
    (req.cookies?.[STORE_CART_COOKIE] as string | undefined) ??
    anyReq?.cookies?.[STORE_CART_COOKIE] ??
    null;
  return v && typeof v === "string" ? v : null;
}

type SetCartPriceListDto = { priceListId: string | null };

@Controller("/store/cart")
@UseGuards(TenantGuard)
export class StoreCartController {
  constructor(
    private readonly carts: StoreCartService,
    private readonly pricingStore: PricingStoreService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateCartDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);

    const cart = await this.carts.createCart(tenantId, { email: dto.email });
    setCartCookie(res, cart.id);

    return { cart: cartToResponseDto(cart) };
  }

  @Get()
  async current(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);

    const { cart } = await this.carts.getOrCreateCurrentCart(tenantId, cartId);
    setCartCookie(res, cart.id);

    return { cart: cartToResponseDto(cart) };
  }

  @Post("/line-items")
  async addLineItem(
    @Req() req: Request,
    @Body() dto: AddLineItemDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);

    // price list context cookie’den gelir
    const priceListId = getPriceListId(req);

    // cart yoksa yarat, sonra line item ekle
    if (!cartId) {
      const cart = await this.carts.createCart(tenantId);
      setCartCookie(res, cart.id);

      const updated = await this.carts.addLineItem(
        tenantId,
        cart.id,
        dto,
        { priceListId }, // ✅ ctx
      );

      return { cart: cartToResponseDto(updated) };
    }

    const updated = await this.carts.addLineItem(
      tenantId,
      cartId,
      dto,
      { priceListId }, // ✅ ctx
    );

    setCartCookie(res, updated.id);
    return { cart: cartToResponseDto(updated) };
  }

  /**
   * Cart’a price list context bağla
   * - cart varsa DB’ye attach
   * - her durumda cookie set/clear
   */
  @Patch("/:cartId/price-list")
  async setCartPriceList(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: SetCartPriceListDto,
  ) {
    const tenantId = requireTenantId(req);

    // route param cartId > cookie cartId
    const cartId =
      (req.params?.cartId as string | undefined) ?? getCartId(req) ?? null;

    // cookie her durumda güncellenir
    setPriceListCookie(res, dto.priceListId ?? null);

    if (!cartId) {
      return { ok: true, cartId: null, priceListId: dto.priceListId ?? null };
    }

    await this.pricingStore.attachPriceListToCart(
      tenantId,
      cartId,
      dto.priceListId ?? null,
    );

    setCartCookie(res, cartId);

    return { ok: true, cartId, priceListId: dto.priceListId ?? null };
  }

  @Delete("/line-items/:id")
  async deleteLineItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);
    if (!cartId) throw new BadRequestException("Missing cart cookie");

    const updated = await this.carts.deleteLineItem(tenantId, cartId, id);
    setCartCookie(res, updated.id);

    return { cart: cartToResponseDto(updated) };
  }

  @Post("/apply-coupon")
  async applyCoupon(
    @Req() req: Request,
    @Body() dto: ApplyCouponDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);
    if (!cartId) throw new BadRequestException("Missing cart cookie");

    const updated = await this.carts.applyCoupon(tenantId, cartId, dto.code);
    setCartCookie(res, updated.id);

    return { cart: cartToResponseDto(updated) };
  }

  @Delete("/coupon")
  async removeCoupon(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);
    if (!cartId) throw new BadRequestException("Missing cart cookie");

    const updated = await this.carts.removeCoupon(tenantId, cartId);
    setCartCookie(res, updated.id);

    return { cart: cartToResponseDto(updated) };
  }

  /**
   * Shipping method set
   *
   * ⚠️ DERLEME NOTU:
   * StoreCartService üzerinde setShippingMethod yoksa TS2339 alırsın.
   * Ya StoreCartService’e setShippingMethod ekle,
   * ya da bu endpoint’i kaldır.
   */
  @Post("/shipping-method")
  async shippingMethod(
    @Req() req: Request,
    @Body() dto: SetShippingMethodDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tenantId = requireTenantId(req);
    const cartId = getCartId(req);
    if (!cartId) throw new BadRequestException("Missing cart cookie");

    const updated = await this.carts.setShippingMethod(
      tenantId,
      cartId,
      dto.shippingOptionId,
    );
    setCartCookie(res, updated.id);

    return { cart: cartToResponseDto(updated) };
  }
}
