import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import type { StoreRequest } from "@/modules/auth/store/common/types/store-request";

import { PaymentsStoreService } from "@/modules/payments/store/services/payment.store.service";
import { StorePaymentDto } from "@/modules/payments/store/dto/store-payment.dto";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

@UseGuards(StoreAccessGuard)
@Controller("/store/payments")
export class PaymentsStoreController {
  constructor(private readonly svc: PaymentsStoreService) {}

  @Post()
  start(@Req() req: StoreRequest, @Body() dto: StorePaymentDto) {
    requireTenantId(req);
    return this.svc.startPayment(req, dto);
  }

  @Get("/checkouts/:checkoutId")
  byCheckout(
    @Req() req: StoreRequest,
    @Param("checkoutId") checkoutId: string,
  ) {
    requireTenantId(req);
    return this.svc.getCheckoutPaymentCollection(req, checkoutId);
  }
}
