import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateOrderFromCheckoutDto } from "@/modules/orders/store/dto/create-order-from-checkout.dto";
import { ListOrdersQueryDto } from "@/modules/orders/store/dto/list-orders.query.dto";
import { CheckoutStatus, OrderStatus, PaymentStatus } from "@prisma/client";

function requireString(v: any, name: string) {
  if (!v || typeof v !== "string")
    throw new BadRequestException(`${name} missing`);
  return v;
}

@Injectable()
export class OrdersStoreService {
  constructor(private readonly prisma: PrismaService) {}

  private getTenantIdFromReq(req: any): string {
    return requireString(
      req?.tenantId ?? req?.user?.tenantId ?? req?.tenant?.id,
      "tenantId"
    );
  }

  private getCustomerIdFromReq(req: any): string {
    return requireString(
      req?.customerId ?? req?.user?.customerId ?? req?.customer?.id,
      "customerId"
    );
  }

  async createFromCheckout(req: any, dto: CreateOrderFromCheckoutDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    if (!dto?.checkoutId) throw new BadRequestException("checkoutId missing");

    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: dto.checkoutId, deletedAt: null },
      include: {
        addresses: true,
        cart: { include: { lineItems: true, shippingMethods: true } },
      },
    });
    if (!checkout) throw new NotFoundException("checkout not found");
    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    if (checkout.status !== CheckoutStatus.OPEN) {
      throw new BadRequestException("checkout is not OPEN");
    }

    const allowWithoutCapturedPayment =
      dto.allowWithoutCapturedPayment ?? false;

    // --- Payment sufficiency rules ---
    // 1) Free order => allow
    const total = checkout.grandTotal ?? 0;
    if (total < 0) throw new BadRequestException("invalid checkout total");

    // Bu blok sadece allowWithoutCapturedPayment=false ise devrede
    let collection: {
      id: string;
      payments: Array<{ provider: any; status: any; amount: number }>;
    } | null = null;
    let isSufficient = false;
    let hasManual = false;

    if (!allowWithoutCapturedPayment && total > 0) {
      const collectionId = (checkout as any).paymentCollectionId as
        | string
        | null;
      if (!collectionId)
        throw new BadRequestException("payment collection missing");

      collection = await this.prisma.paymentCollection.findFirst({
        where: { tenantId, id: collectionId, deletedAt: null },
        select: {
          id: true,
          payments: {
            where: { deletedAt: null },
            select: { provider: true, status: true, amount: true },
          },
        },
      });

      if (!collection)
        throw new BadRequestException("payment collection missing");

      hasManual = collection.payments.some((p) => p.provider === "MANUAL");

      // “Paid sum” hesabı: captured/authorized olanların amount toplamı
      const paidSum = collection.payments
        .filter(
          (p) =>
            p.status === PaymentStatus.CAPTURED ||
            p.status === PaymentStatus.AUTHORIZED
        )
        .reduce((acc, p) => acc + (p.amount ?? 0), 0);

      // Kurallar:
      // - Manual varsa (havale/COD benzeri) => order açılabilir (ödemeyi sonra bekleriz)
      // - Manual yoksa paidSum >= total olmalı (sizin sıkı kuralınız)
      isSufficient = hasManual || paidSum >= total;

      if (!isSufficient)
        throw new BadRequestException("payment not sufficient");
    }

    // --- Transaction ---
    const order = await this.prisma.$transaction(async (tx) => {
      const orderNo = `TMP-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2, 8)}`;

      const created = await tx.order.create({
        data: {
          tenantId,
          checkoutId: checkout.id,
          customerId,
          email: checkout.email ?? "",
          status: OrderStatus.PENDING,
          currencyCode: checkout.currencyCode,
          subtotal: checkout.subtotal,
          discountTotal: checkout.discountTotal,
          shippingTotal: checkout.shippingTotal,
          taxTotal: checkout.taxTotal,
          grandTotal: checkout.grandTotal,
          orderNo,
          metadata: { checkoutId: checkout.id },
        },
      });

      // checkout lock / state:
      // - total=0 => COMPLETED
      // - manual (unpaid) => PAYMENT_PENDING (sipariş açıldı ama tahsilat bekliyor)
      // - paid (captured/authorized) => COMPLETED
      let nextCheckoutStatus: CheckoutStatus = CheckoutStatus.OPEN;

      if (total === 0) {
        nextCheckoutStatus = CheckoutStatus.COMPLETED;
      } else if (allowWithoutCapturedPayment) {
        // bu mod açılmışsa bile manual mantığıyla davranmak daha doğru
        nextCheckoutStatus = CheckoutStatus.PAYMENT_PENDING;
      } else {
        // allowWithoutCapturedPayment=false iken buraya geliyorsak:
        // - manual ise: PAYMENT_PENDING
        // - manual değilse: sufficient olduğuna göre COMPLETED’e alabiliriz
        nextCheckoutStatus = hasManual
          ? CheckoutStatus.PAYMENT_PENDING
          : CheckoutStatus.COMPLETED;
      }

      await tx.checkout.update({
        where: { tenantId_id: { tenantId, id: checkout.id } },
        data: { status: nextCheckoutStatus },
      });

      // collection -> order bağla (varsa)
      const checkoutCollectionId = (checkout as any).paymentCollectionId as
        | string
        | null;
      if (checkoutCollectionId) {
        await tx.paymentCollection.update({
          where: { tenantId_id: { tenantId, id: checkoutCollectionId } },
          data: { orderId: created.id },
        });
      }

      return created;
    });

    return { order };
  }

  async listMyOrders(req: any, q: ListOrdersQueryDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const page = Math.max(1, Number(q?.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(q?.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: any = { tenantId, customerId, deletedAt: null };

    if (q?.status) where.status = q.status;

    if (q?.minTotal != null || q?.maxTotal != null) {
      where.grandTotal = {};
      if (q.minTotal != null) where.grandTotal.gte = q.minTotal;
      if (q.maxTotal != null) where.grandTotal.lte = q.maxTotal;
    }

    if (q?.fromDate || q?.toDate) {
      where.createdAt = {};
      if (q.fromDate) where.createdAt.gte = new Date(q.fromDate);
      if (q.toDate) where.createdAt.lte = new Date(q.toDate);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          orderNo: true,
          status: true,
          grandTotal: true,
          currencyCode: true,
          createdAt: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      items,
    };
  }

  async getMyOrderDetail(req: any, orderId: string) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const order = await this.prisma.order.findFirst({
      where: { tenantId, id: orderId, deletedAt: null },
      include: {
        lineItems: true,
        payments: true,
        refunds: true,
        addresses: true,
        shippingMethods: true,
      },
    });

    if (!order) throw new NotFoundException("order not found");
    if (order.customerId && order.customerId !== customerId) {
      throw new ForbiddenException("not your order");
    }

    return { order };
  }
}
