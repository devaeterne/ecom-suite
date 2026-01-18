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

import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";

import { OrdersStoreService } from "@/modules/orders/store/services/orders.store.service";
import { ListOrdersQueryDto } from "@/modules/orders/store/dto/list-orders.query.dto";
import { CreateOrderFromCheckoutDto } from "@/modules/orders/store/dto/create-order-from-checkout.dto";

@UseGuards(StoreAccessGuard)
@Controller("/store/orders")
export class OrdersStoreController {
  constructor(private readonly svc: OrdersStoreService) {}

  @Get()
  list(@Req() req: StoreAuthContext, @Query() query: ListOrdersQueryDto) {
    return this.svc.list(req, query);
  }

  @Get("/:id")
  detail(@Req() req: StoreAuthContext, @Param("id") id: string) {
    return this.svc.detail(req, id);
  }

  @Post("/from-checkout")
  createFromCheckout(
    @Req() req: StoreAuthContext,
    @Body() dto: CreateOrderFromCheckoutDto,
  ) {
    return this.svc.createFromCheckout(req, dto);
  }
}
