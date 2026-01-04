import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";
import { OrdersStoreService } from "@/modules/orders/store/services/orders.store.service";
import { CreateOrderFromCheckoutDto } from "@/modules/orders/store/dto/create-order-from-checkout.dto";
import { ListOrdersQueryDto } from "@/modules/orders/store/dto/list-orders.query.dto";

@Controller("/store/orders")
@UseGuards(StoreAccessGuard)
export class OrdersStoreController {
  constructor(private readonly svc: OrdersStoreService) {}

  /**
   * checkout -> order
   */
  @Post("/from-checkout")
  async createFromCheckout(
    @Req() req: any,
    @Body() dto: CreateOrderFromCheckoutDto
  ) {
    return this.svc.createFromCheckout(req, dto);
  }

  /**
   * my orders list (pagination)
   */
  @Get()
  async list(@Req() req: any, @Query() q: ListOrdersQueryDto) {
    return this.svc.listMyOrders(req, q);
  }

  /**
   * my order detail
   */
  @Get(":id")
  async detail(@Req() req: any, @Param("id") orderId: string) {
    return this.svc.getMyOrderDetail(req, orderId);
  }
}
