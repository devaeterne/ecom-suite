import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class OrdersRepo {
  constructor(private readonly prisma: PrismaService) {}

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

    // Senin Prisma error’ına göre zorunlu alanlar: orderNo, email
    return this.prisma.order.create({
      data: {
        tenantId,
        customerId,
        checkoutId,
        orderNo,
        email,
        status: OrderStatus.PENDING,
      },
    });
  }
}
