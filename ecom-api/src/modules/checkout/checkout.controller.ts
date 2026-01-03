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
import { CheckoutService } from "./checkout.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { UpsertCheckoutAddressDto } from "./dto/upsert-checkout-address.dto";
import { StartPaymentDto } from "./dto/start-payment.dto";

// Sizdeki guard ismi farklıysa onu koy: StoreAuthGuard / StoreJwtAuthGuard vs.
import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";

@Controller("/store/checkouts")
@UseGuards(StoreAccessGuard)
export class CheckoutController {
  constructor(private readonly svc: CheckoutService) {}

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

  @Post(":id/payments")
  async startPayment(
    @Req() req: any,
    @Param("id") checkoutId: string,
    @Body() dto: StartPaymentDto
  ) {
    return this.svc.startPayment(req, checkoutId, dto);
  }
}
