import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ShipmentStatus,
  TrackingEventType,
  FulfillmentStatus,
} from "@prisma/client";
import { OrdersRepo } from "../../common/prisma/orders.repo";

@Injectable()
export class ShipmentsAdminService {
  constructor(private readonly repo: OrdersRepo) {}

  list(params: { tenantId: string; fulfillmentId: string }) {
    return this.repo.listShipments(params);
  }

  create(params: {
    tenantId: string;
    fulfillmentId: string;
    carrierId: string;
    trackingNumber?: string;
    trackingUrl?: string;
    labelUrl?: string;
    providerShipmentId?: string;
    metadata?: any;
  }) {
    return this.repo.createShipment({
      tenantId: params.tenantId,
      fulfillmentId: params.fulfillmentId,
      carrierId: params.carrierId,
      trackingNumber: params.trackingNumber ?? null,
      trackingUrl: params.trackingUrl ?? null,
      labelUrl: params.labelUrl ?? null,
      providerShipmentId: params.providerShipmentId ?? null,
      metadata: params.metadata ?? {},
    });
  }

  async addEvent(params: {
    tenantId: string;
    shipmentId: string;
    type: TrackingEventType;
    status?: ShipmentStatus;
    message?: string;
    location?: string;
    raw?: any;
    occurredAt: Date;
  }) {
    // 1) event create
    await this.repo.createShipmentEvent({
      tenantId: params.tenantId,
      shipmentId: params.shipmentId,
      data: {
        type: params.type,
        status: params.status ?? null,
        message: params.message ?? null,
        location: params.location ?? null,
        raw: params.raw ?? {},
        occurredAt: params.occurredAt,
      },
    });

    // 2) shipment status update (optional)
    if (params.status) {
      const patch: any = { status: params.status };
      if (params.status === ShipmentStatus.DELIVERED)
        patch.deliveredAt = new Date();
      if (params.status === ShipmentStatus.IN_TRANSIT)
        patch.shippedAt = new Date();

      await this.repo.patchShipment({
        tenantId: params.tenantId,
        shipmentId: params.shipmentId,
        data: patch,
      });
    }

    // return fresh detail (optional)
    return { ok: true };
  }

  async markDelivered(params: { tenantId: string; shipmentId: string }) {
    const shipment = await this.repo.findShipment({
      tenantId: params.tenantId,
      shipmentId: params.shipmentId,
    });

    if (!shipment) throw new NotFoundException("Shipment not found");

    // ✅ idempotency: zaten delivered ise dokunma
    if (shipment.status === ShipmentStatus.DELIVERED) {
      return shipment;
    }

    const now = new Date();

    // 1) shipment delivered
    await this.repo.patchShipment({
      tenantId: params.tenantId,
      shipmentId: params.shipmentId,
      data: {
        status: ShipmentStatus.DELIVERED,
        deliveredAt: now,
      },
    });

    // 2) event bas (kurumsal audit)
    await this.repo.createShipmentEvent({
      tenantId: params.tenantId,
      shipmentId: params.shipmentId,
      data: {
        type: TrackingEventType.DELIVERY_ATTEMPT,
        status: ShipmentStatus.DELIVERED,
        message: "Delivered (admin action)",
        occurredAt: now,
        raw: {},
      },
    });

    // 3) fulfillment sync
    await this.repo.patchFulfillment({
      tenantId: params.tenantId,
      id: shipment.orderFulfillmentId,
      data: {
        status: FulfillmentStatus.DELIVERED,
      },
    });

    // 4) fresh read
    return this.repo.findShipment({
      tenantId: params.tenantId,
      shipmentId: params.shipmentId,
    });
  }
}
