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

import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import type { StoreRequest } from "@/modules/auth/store/common/types/store-request";

import { CheckoutService } from "@/modules/checkout/store/services/checkout.service";
import { CreateCheckoutDto } from "@/modules/checkout/store/dto/create-checkout.dto";
import { UpsertCheckoutAddressDto } from "@/modules/checkout/store/dto/upsert-checkout-address.dto";
import { StartPaymentDto } from "@/modules/checkout/store/dto/start-payment.dto";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

@UseGuards(StoreAccessGuard)
@Controller("/store/checkout")
export class CheckoutStoreController {
  constructor(private readonly svc: CheckoutService) {}

  @Post()
  create(@Req() req: StoreRequest, @Body() dto: CreateCheckoutDto) {
    requireTenantId(req);
    return this.svc.createCheckout(req, dto);
  }

  @Patch("/:id/addresses")
  upsertAddress(
    @Req() req: StoreRequest,
    @Param("id") id: string,
    @Body() dto: UpsertCheckoutAddressDto,
  ) {
    requireTenantId(req);
    return this.svc.upsertAddress(req, id, dto);
  }

  @Get("/:id/payment-providers")
  providers(@Req() req: StoreRequest, @Param("id") id: string) {
    requireTenantId(req);
    return this.svc.getAvailablePaymentProviders(req, id);
  }

  @Post("/:id/start-payment")
  startPayment(
    @Req() req: StoreRequest,
    @Param("id") id: string,
    @Body() dto: StartPaymentDto,
  ) {
    requireTenantId(req);
    return this.svc.startPayment(req, id, dto);
  }
}
