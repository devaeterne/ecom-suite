// src/modules/checkout/store/controllers/checkout.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";
import type { StoreRequest } from "@/modules/auth/store/store-request";

import { CheckoutService } from "@/modules/checkout/store/services/checkout.service";
import { CreateCheckoutDto } from "@/modules/checkout/store/dto/create-checkout.dto";
import { UpsertCheckoutAddressDto } from "@/modules/checkout/store/dto/upsert-checkout-address.dto";
import { StartPaymentDto } from "@/modules/checkout/store/dto/start-payment.dto";

@UseGuards(StoreAccessGuard)
@Controller("store/checkout")
export class CheckoutStoreController {
  constructor(private readonly svc: CheckoutService) {}

  @Post()
  create(@Req() req: StoreRequest, @Body() dto: CreateCheckoutDto) {
    return this.svc.createCheckout(req, dto);
  }

  /**
   * Address upsert:
   * - dto.type: "SHIPPING" | "BILLING"
   * - checkoutId: :id
   */
  @Patch(":id/addresses")
  upsertAddress(
    @Req() req: StoreRequest,
    @Param("id") id: string,
    @Body() dto: UpsertCheckoutAddressDto
  ) {
    return this.svc.upsertAddress(req, id, dto);
  }

  @Get(":id/payment-providers")
  providers(@Req() req: StoreRequest, @Param("id") id: string) {
    return this.svc.getAvailablePaymentProviders(req, id);
  }

  @Post(":id/start-payment")
  startPayment(
    @Req() req: StoreRequest,
    @Param("id") id: string,
    @Body() dto: StartPaymentDto
  ) {
    return this.svc.startPayment(req, id, dto);
  }
}
