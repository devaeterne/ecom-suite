import {
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
import { STORE_CART_COOKIE } from "@modules/store/cart/cart.contants";
import {
  CreateCartDto,
  AddLineItemDto,
  UpdateLineItemDto,
  ApplyCouponDto,
  SetShippingMethodDto,
} from "@modules/store/cart/cart.dto";
import { getTenantIdOrThrow } from "@modules/store/cart/cart.tenants";
import { StoreCartService } from "@modules/store/cart/cart.service";

function getCartId(req: Request): string | null {
  const anyReq = req as any;
  const v =
    (req.cookies?.[STORE_CART_COOKIE] as string | undefined) ??
    anyReq?.cookies?.[STORE_CART_COOKIE] ??
    null;
  return v && typeof v === "string" ? v : null;
}

function setCartCookie(res: Response, cartId: string) {
  res.cookie(STORE_CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // prod: true
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

@Controller("/store/cart")
export class StoreCartController {
  constructor(private readonly carts: StoreCartService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateCartDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cart = await this.carts.createCart(tenantId, { email: dto.email });
    setCartCookie(res, cart.id);
    return { cart };
  }

  @Get()
  async current(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);
    const { cart } = await this.carts.getOrCreateCurrentCart(tenantId, cartId);
    setCartCookie(res, cart.id);
    return { cart };
  }

  @Post("/line-items")
  async addLineItem(
    @Req() req: Request,
    @Body() dto: AddLineItemDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);
    if (!cartId) {
      // cookie yoksa, önce cart açıp sonra ekle
      const cart = await this.carts.createCart(tenantId);
      setCartCookie(res, cart.id);
      const updated = await this.carts.addLineItem(tenantId, cart.id, dto);
      return { cart: updated };
    }

    const updated = await this.carts.addLineItem(tenantId, cartId, dto);
    setCartCookie(res, updated.id);
    return { cart: updated };
  }

  @Patch("/line-items/:id")
  async updateLineItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateLineItemDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);
    if (!cartId) throw new Error("Missing cart cookie");

    const updated = await this.carts.updateLineItem(tenantId, cartId, id, dto);
    setCartCookie(res, updated.id);
    return { cart: updated };
  }

  @Delete("/line-items/:id")
  async deleteLineItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);
    if (!cartId) throw new Error("Missing cart cookie");

    const updated = await this.carts.deleteLineItem(tenantId, cartId, id);
    setCartCookie(res, updated.id);
    return { cart: updated };
  }

  @Post("/apply-coupon")
  async applyCoupon(
    @Req() req: Request,
    @Body() dto: ApplyCouponDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);
    if (!cartId) throw new Error("Missing cart cookie");

    const updated = await this.carts.applyCoupon(tenantId, cartId, dto.code);
    setCartCookie(res, updated!.id);
    return { cart: updated };
  }

  @Post("/shipping-method")
  async shippingMethod(
    @Req() req: Request,
    @Body() dto: SetShippingMethodDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const cartId = getCartId(req);
    if (!cartId) throw new Error("Missing cart cookie");

    const updated = await this.carts.setShippingMethod(
      tenantId,
      cartId,
      dto.shippingOptionId
    );
    setCartCookie(res, updated!.id);
    return { cart: updated };
  }
}
