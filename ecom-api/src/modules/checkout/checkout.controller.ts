import { Body, Controller, Param, Post } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import { PlaceOrderDto } from "./dto/place-order.dto";

@Controller("/api/checkouts")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(":id/place-order")
  placeOrder(@Param("id") checkoutId: string, @Body() dto: PlaceOrderDto) {
    return this.checkoutService.placeOrder(checkoutId);
  }
}
