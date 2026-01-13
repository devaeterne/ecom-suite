// src/modules/orders/common/prisma/orders.repo.ts
import { Injectable } from "@nestjs/common";
import {
  FulfillmentStatus,
  OrderStatus,
  ShipmentStatus,
  TrackingEventType,
} from "@prisma/client";

import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class OrdersRepo {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------
  // Orders
  // --------------------------------------------
  listOrders(params: {
    tenantId: string;
    customerId: string;
    status?: OrderStatus;
    skip?: number;
    take?: number;
    minTotal?: number;
    maxTotal?: number;
    fromDate?: string; // ISO
    toDate?: string; // ISO
  }) {
    const {
      tenantId,
      customerId,
      status,
      skip,
      take,
      minTotal,
      maxTotal,
      fromDate,
      toDate,
    } = params;

    return this.prisma.order.findMany({
      where: {
        tenantId,
        customerId,
        ...(status ? { status } : {}),
        ...(minTotal !== undefined ? { grandTotal: { gte: minTotal } } : {}),
        ...(maxTotal !== undefined ? { grandTotal: { lte: maxTotal } } : {}),
        ...(fromDate ? { createdAt: { gte: new Date(fromDate) } } : {}),
        ...(toDate ? { createdAt: { lte: new Date(toDate) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
  }

  getOrderOrThrow(params: { tenantId: string; orderId: string }) {
    const { tenantId, orderId } = params;
    return this.prisma.order.findFirstOrThrow({
      where: { tenantId, id: orderId },
    });
  }

  createFromCheckout(params: {
    tenantId: string;
    customerId: string;
    checkoutId: string;
    orderNo: string;
    email: string;
  }) {
    const { tenantId, customerId, checkoutId, orderNo, email } = params;

    return this.prisma.$transaction(async (tx) => {
      // 1) Checkout'u tenant scope ile çek (cartId lazım)
      const checkout = await tx.checkout.findFirst({
        where: {
          tenantId,
          id: checkoutId,
          deletedAt: null,
        },
        select: {
          id: true,
          cartId: true,
        },
      });

      if (!checkout) {
        throw new Error("CHECKOUT_NOT_FOUND");
      }

      // 2) Order create
      const order = await tx.order.create({
        data: {
          tenantId,
          customerId,
          checkoutId,
          orderNo,
          email,
          status: OrderStatus.PENDING,
        },
        select: { id: true },
      });

      // 3) CartShippingMethod snapshot -> OrderShippingMethod
      const cartShippingMethod = await tx.cartShippingMethod.findFirst({
        where: {
          tenantId,
          cartId: checkout.cartId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: {
          shippingOptionId: true,
          amount: true,
          currencyCode: true,
          metadata: true,
        },
      });

      if (cartShippingMethod) {
        await tx.orderShippingMethod.create({
          data: {
            tenantId,
            orderId: order.id,
            shippingOptionId: cartShippingMethod.shippingOptionId,
            amount: cartShippingMethod.amount,
            currencyCode: cartShippingMethod.currencyCode,
            metadata: (cartShippingMethod.metadata ?? {}) as any,
          },
        });
      }

      return order;
    });
  }

  // --------------------------------------------
  // Fulfillment
  // --------------------------------------------
  listFulfillments(params: { tenantId: string; orderId: string }) {
    const { tenantId, orderId } = params;

    return this.prisma.orderFulfillment.findMany({
      where: { tenantId, orderId, deletedAt: null },
      include: {
        carrier: true,
        items: true,
        shipments: {
          where: { deletedAt: null },
          include: {
            carrier: true,
            events: { orderBy: { occurredAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  createFulfillment(params: {
    tenantId: string;
    orderId: string;
    status?: FulfillmentStatus;
    carrierId?: string | null;
    trackingNo?: string | null;
    metadata?: unknown;
  }) {
    const { tenantId, orderId, status, carrierId, trackingNo, metadata } =
      params;

    return this.prisma.orderFulfillment.create({
      data: {
        tenantId,
        orderId,
        status: status ?? FulfillmentStatus.PENDING,
        carrierId: carrierId ?? null,
        trackingNo: trackingNo ?? null,
        metadata: (metadata ?? {}) as any,
      },
      include: {
        carrier: true,
        items: true,
        shipments: {
          where: { deletedAt: null },
          include: {
            carrier: true,
            events: { orderBy: { occurredAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  patchFulfillment(params: {
    tenantId: string;
    id: string;
    data: {
      status?: FulfillmentStatus;
      carrierId?: string | null;
      trackingNo?: string | null;
      metadata?: unknown;
    };
  }) {
    const { tenantId, id, data } = params;

    // Not: model PK sadece id ise updateMany ile tenant guard koyuyoruz.
    return this.prisma.orderFulfillment.updateMany({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.carrierId !== undefined ? { carrierId: data.carrierId } : {}),
        ...(data.trackingNo !== undefined
          ? { trackingNo: data.trackingNo }
          : {}),
        ...(data.metadata !== undefined
          ? { metadata: data.metadata as any }
          : {}),
      },
    });
  }

  // --------------------------------------------
  // Shipments
  // --------------------------------------------
  listShipments(params: { tenantId: string; fulfillmentId: string }) {
    const { tenantId, fulfillmentId } = params;

    return this.prisma.shipment.findMany({
      where: {
        tenantId,
        orderFulfillmentId: fulfillmentId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        carrier: true,
        events: { orderBy: { occurredAt: "asc" } },
      },
    });
  }

  createShipment(params: {
    tenantId: string;
    fulfillmentId: string;
    carrierId: string;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    labelUrl?: string | null;
    providerShipmentId?: string | null;
    metadata?: unknown;
  }) {
    const {
      tenantId,
      fulfillmentId,
      carrierId,
      trackingNumber,
      trackingUrl,
      labelUrl,
      providerShipmentId,
      metadata,
    } = params;

    return this.prisma.shipment.create({
      data: {
        tenantId,
        orderFulfillmentId: fulfillmentId,
        carrierId,
        status: ShipmentStatus.CREATED,
        trackingNumber: trackingNumber ?? null,
        trackingUrl: trackingUrl ?? null,
        labelUrl: labelUrl ?? null,
        providerShipmentId: providerShipmentId ?? null,
        metadata: (metadata ?? {}) as any,
      },
      include: {
        carrier: true,
        events: { orderBy: { occurredAt: "asc" } },
        orderFulfillment: true,
      },
    });
  }

  findShipment(params: { tenantId: string; shipmentId: string }) {
    const { tenantId, shipmentId } = params;

    return this.prisma.shipment.findFirst({
      where: {
        tenantId,
        id: shipmentId,
        deletedAt: null,
      },
      include: {
        carrier: true,
        events: { orderBy: { occurredAt: "asc" } },
        orderFulfillment: true,
      },
    });
  }

  patchShipment(params: {
    tenantId: string;
    shipmentId: string;
    data: {
      status?: ShipmentStatus;
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      labelUrl?: string | null;
      providerShipmentId?: string | null;
      shippedAt?: Date | null;
      deliveredAt?: Date | null;
      metadata?: unknown;
    };
  }) {
    const { tenantId, shipmentId, data } = params;

    // Tenant + deletedAt guard için updateMany
    return this.prisma.shipment.updateMany({
      where: { tenantId, id: shipmentId, deletedAt: null },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.trackingNumber !== undefined
          ? { trackingNumber: data.trackingNumber }
          : {}),
        ...(data.trackingUrl !== undefined
          ? { trackingUrl: data.trackingUrl }
          : {}),
        ...(data.labelUrl !== undefined ? { labelUrl: data.labelUrl } : {}),
        ...(data.providerShipmentId !== undefined
          ? { providerShipmentId: data.providerShipmentId }
          : {}),
        ...(data.shippedAt !== undefined ? { shippedAt: data.shippedAt } : {}),
        ...(data.deliveredAt !== undefined
          ? { deliveredAt: data.deliveredAt }
          : {}),
        ...(data.metadata !== undefined
          ? { metadata: data.metadata as any }
          : {}),
      },
    });
  }

  findOrder(params: { tenantId: string; orderId: string }) {
    return this.prisma.order.findFirst({
      where: { tenantId: params.tenantId, id: params.orderId },
      select: { id: true }, // minimal
    });
  }
  createShipmentEvent(params: {
    tenantId: string;
    shipmentId: string;
    data: {
      type: TrackingEventType;
      status?: ShipmentStatus | null;
      message?: string | null;
      location?: string | null;
      raw?: unknown;
      occurredAt: Date;
    };
  }) {
    const { tenantId, shipmentId, data } = params;

    return this.prisma.shipmentTrackingEvent.create({
      data: {
        tenantId,
        shipmentId,
        type: data.type,
        status: data.status ?? null,
        message: data.message ?? null,
        location: data.location ?? null,
        raw: (data.raw ?? {}) as any,
        occurredAt: data.occurredAt,
      },
    });
  }
  findFulfillment(params: { tenantId: string; fulfillmentId: string }) {
    return this.prisma.orderFulfillment.findFirst({
      where: { tenantId: params.tenantId, id: params.fulfillmentId },
      select: { id: true },
    });
  }
}
