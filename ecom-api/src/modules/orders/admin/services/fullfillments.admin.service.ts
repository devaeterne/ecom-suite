import { Injectable, NotFoundException } from "@nestjs/common";
import { FulfillmentStatus } from "@prisma/client";
import { OrdersRepo } from "../../common/prisma/orders.repo";

@Injectable()
export class FullfillmentsAdminService {
  constructor(private readonly repo: OrdersRepo) {}

  async list(params: { tenantId: string; orderId: string }) {
    // opsiyonel ama “kurumsal düzgünlük”: order yoksa 404
    const order = await this.repo.findOrder({
      tenantId: params.tenantId,
      orderId: params.orderId,
    });
    if (!order) throw new NotFoundException("Order not found");

    return this.repo.listFulfillments(params);
  }

  async create(params: {
    tenantId: string;
    orderId: string;
    carrierId?: string;
    trackingNo?: string;
    status?: FulfillmentStatus;
    metadata?: any;
  }) {
    const order = await this.repo.findOrder({
      tenantId: params.tenantId,
      orderId: params.orderId,
    });
    if (!order) throw new NotFoundException("Order not found");

    return this.repo.createFulfillment({
      tenantId: params.tenantId,
      orderId: params.orderId,
      carrierId: params.carrierId ?? null,
      trackingNo: params.trackingNo ?? null,
      status: params.status,
      metadata: params.metadata ?? {},
    });
  }

  patch(params: {
    tenantId: string;
    id: string;
    status?: FulfillmentStatus;
    carrierId?: string | null;
    trackingNo?: string | null;
    metadata?: any;
  }) {
    return this.repo.patchFulfillment({
      tenantId: params.tenantId,
      id: params.id,
      data: {
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.carrierId !== undefined
          ? { carrierId: params.carrierId }
          : {}),
        ...(params.trackingNo !== undefined
          ? { trackingNo: params.trackingNo }
          : {}),
        ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
      },
    });
  }
}
