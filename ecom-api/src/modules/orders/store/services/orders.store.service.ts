import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { randomUUID } from "crypto";

import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";

import { OrdersRepo } from "@/modules/orders/common/prisma/orders.repo";
import {
  toOrderDetail,
  toOrderListItem,
  toOrderResponse,
} from "@/modules/orders/common/mappers/orders.mapper";

import { assertOrderOwnedByCustomer } from "@/modules/orders/common/policies/order.ownership";

import { getTenantIdOrThrow } from "@/modules/checkout/common/policies/checkout.tenancy";
import { getCustomerIdOrThrow } from "@/modules/checkout/common/policies/checkout.auth";

import { ListOrdersQueryDto } from "@/modules/orders/store/dto/list-orders.query.dto";
import { CreateOrderFromCheckoutDto } from "@/modules/orders/store/dto/create-order-from-checkout.dto";

@Injectable()
export class OrdersStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: OrdersRepo
  ) {}

  async list(req: StoreAuthContext, query: ListOrdersQueryDto) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const rows = await this.repo.listOrders({
      tenantId,
      customerId,
      status: query.status,
      skip,
      take: limit,
      minTotal: query.minTotal,
      maxTotal: query.maxTotal,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });

    return {
      items: rows.map(toOrderListItem),
      page,
      limit,
    };
  }

  async detail(req: StoreAuthContext, orderId: string) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    await assertOrderOwnedByCustomer(this.prisma, {
      tenantId,
      orderId,
      customerId,
    });

    const order = await this.repo.getOrderOrThrow({ tenantId, orderId });
    return { order: toOrderDetail(order) };
  }

  async createFromCheckout(
    req: StoreAuthContext,
    dto: CreateOrderFromCheckoutDto
  ) {
    const tenantId = getTenantIdOrThrow(req);
    const customerId = getCustomerIdOrThrow(req);

    const customer = await this.prisma.customer.findUnique({
      where: { tenantId_id: { tenantId, id: customerId } },
      select: { email: true },
    });
    if (!customer?.email) throw new NotFoundException("customer not found");

    const order = await this.repo.createFromCheckout({
      tenantId,
      customerId,
      checkoutId: dto.checkoutId,
      orderNo: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
      email: customer.email,
    });

    return { order: toOrderResponse(order) };
  }
}
