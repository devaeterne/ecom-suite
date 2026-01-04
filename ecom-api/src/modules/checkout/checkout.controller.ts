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

import { CheckoutService } from "./checkout.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { UpsertCheckoutAddressDto } from "./dto/upsert-checkout-address.dto";
import { StartPaymentDto } from "./dto/start-payment.dto";

import { PaymentsStoreService } from "@/modules/payments/store/services/payment.store.service";

@Controller("/store/checkouts")
@UseGuards(StoreAccessGuard)
export class CheckoutController {
  constructor(
    private readonly svc: CheckoutService,
    private readonly paymentsStoreService: PaymentsStoreService
  ) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCheckoutDto) {
    return this.svc.createCheckout(req, dto);
  }

  @Patch(":id/address")
  async upsertAddress(
    @Req() req: any,
    @Param("id") checkoutId: string,
    @Body() dto: UpsertCheckoutAddressDto
  ) {
    return this.svc.upsertAddress(req, checkoutId, dto);
  }

  @Get(":id/payment-providers")
  async providers(@Req() req: any, @Param("id") checkoutId: string) {
    return this.svc.getAvailablePaymentProviders(req, checkoutId);
  }

  /**
   * ✅ Payment start (collection + checkout link + payment create)
   * POST /api/store/checkouts/:id/payments
   */
  @Post(":id/payments")
  async startPayment(
    @Req() req: any,
    @Param("id") checkoutId: string,
    @Body() dto: StartPaymentDto
  ) {
    return this.paymentsStoreService.startPayment(req, checkoutId, dto);
  }

  /**
   * ✅ Payment collection query
   * GET /api/store/checkouts/:id/payment-collection
   */
  @Get(":id/payment-collection")
  async getPaymentCollection(@Req() req: any, @Param("id") checkoutId: string) {
    return this.paymentsStoreService.getCheckoutPaymentCollection(
      req,
      checkoutId
    );
  }
}
