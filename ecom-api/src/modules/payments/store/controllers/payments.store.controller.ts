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
import { PaymentsStoreService } from "@/modules/payments/store/services/payment.store.service";
import { StartPaymentDto } from "@/modules/payments/store/dto/start-payment.dto";
import { StorePaymentDto } from "@/modules/payments/store/dto/store-payment.dto";

@Controller("/store/payments")
@UseGuards(StoreAccessGuard)
export class PaymentsStoreController {
  constructor(private readonly svc: PaymentsStoreService) {}

  @Post()
  async start(@Req() req: any, @Body() dto: StorePaymentDto) {
    // PaymentsStoreService.startPayment(req, checkoutId, dto) bekliyor:
    return this.svc.startPayment(req, dto.checkoutId, dto as any);
  }

  @Get("checkouts/:checkoutId")
  async byCheckout(@Req() req: any, @Param("checkoutId") checkoutId: string) {
    return this.svc.getCheckoutPaymentCollection(req, checkoutId);
  }
}
