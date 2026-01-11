import { Injectable, NotFoundException } from "@nestjs/common";
import { FulfillmentStatus } from "@prisma/client";
import { OrdersRepo } from "../../common/prisma/orders.repo";

@Injectable()
export class FullfillmentsAdminService {
  constructor(private readonly repo: OrdersRepo) {}

  list(params: { tenantId: string; orderId: string }) {
    return this.repo.listFulfillments(params);
  }

  create(params: {
    tenantId: string;
    orderId: string;
    carrierId?: string;
    trackingNo?: string;
    status?: FulfillmentStatus;
    metadata?: any;
  }) {
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
