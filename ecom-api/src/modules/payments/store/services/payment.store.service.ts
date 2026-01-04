import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { StartPaymentDto } from "@/modules/payments/store/dto/start-payment.dto";
import {
  CheckoutStatus,
  PaymentCollectionStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";

function requireString(v: any, name: string) {
  if (!v || typeof v !== "string")
    throw new BadRequestException(`${name} missing`);
  return v;
}

@Injectable()
export class PaymentsStoreService {
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

  /**
   * Checkout’tan ülke bazlı provider listesi (senin checkout.service ile aynı mantık)
   */
  private async getAvailableProviders(tenantId: string, checkoutId: string) {
    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      include: { addresses: true },
    });
    if (!checkout) throw new NotFoundException("checkout not found");

    const shipping =
      checkout.addresses.find((a) => a.type === "SHIPPING") ?? null;
    const countryIso2 = shipping?.countryIso2 ?? null;

    const base: Array<{ provider: PaymentProvider; reason: string }> = [
      {
        provider: PaymentProvider.MANUAL,
        reason: "bank transfer / pay at store",
      },
    ];

    if (countryIso2 === "TR") {
      base.unshift({ provider: PaymentProvider.PAYTR, reason: "TR rule" });
    } else if (countryIso2 && ["DE", "FR", "GB"].includes(countryIso2)) {
      base.unshift({ provider: PaymentProvider.STRIPE, reason: "EU/GB rule" });
    } else if (countryIso2) {
      base.unshift({
        provider: PaymentProvider.VERIFONE,
        reason: "default rule",
      });
    }

    const enabled = await this.prisma.tenantPaymentProvider.findMany({
      where: { tenantId },
      select: { provider: true },
    });
    const enabledSet = new Set<PaymentProvider>(enabled.map((x) => x.provider));

    const providers = base.filter(
      (x) => x.provider === PaymentProvider.MANUAL || enabledSet.has(x.provider)
    );

    return { providers, countryIso2 };
  }

  async startPayment(req: any, checkoutId: string, dto: StartPaymentDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const idempotencyKey = dto?.idempotencyKey;
    if (!idempotencyKey)
      throw new BadRequestException("idempotencyKey missing");

    const provider = dto?.provider;
    if (!provider) throw new BadRequestException("provider missing");

    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      include: { addresses: true },
    });
    if (!checkout) throw new NotFoundException("checkout not found");
    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }
    if (checkout.status !== CheckoutStatus.OPEN) {
      throw new BadRequestException("checkout is not OPEN");
    }

    const { providers } = await this.getAvailableProviders(
      tenantId,
      checkoutId
    );
    if (!providers.find((p) => p.provider === provider)) {
      throw new ForbiddenException("payment provider not available");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const collection = await tx.paymentCollection.upsert({
        where: {
          tenantId_idempotencyKey: {
            tenantId,
            idempotencyKey, // ✅ artık string
          },
        },
        update: {},
        create: {
          tenantId,
          status: PaymentCollectionStatus.ACTIVE,
          amount: checkout.grandTotal,
          currencyCode: checkout.currencyCode,
          idempotencyKey, // ✅ artık string
          metadata: {
            checkoutId,
            returnUrl: dto.returnUrl ?? null,
            cancelUrl: dto.cancelUrl ?? null,
            locale: dto.locale ?? null,
            customerId,
          },
        },
      });

      // ⚠️ burada paymentCollectionId alanı Checkout modelinde yoksa TS zaten patlar.
      await tx.checkout.update({
        where: { tenantId_id: { tenantId, id: checkoutId } },
        data: { paymentCollectionId: collection.id },
      });

      const payment = await tx.payment.create({
        data: {
          tenantId,
          collectionId: collection.id,
          provider, // ✅ PaymentProvider ile uyumluysa
          status: PaymentStatus.PENDING,
          amount: checkout.grandTotal,
          currencyCode: checkout.currencyCode,
          metadata: { checkoutId, customerId },
        },
      });

      return { collection, payment };
    });

    return result;
  }

  async getCheckoutPaymentCollection(req: any, checkoutId: string) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId, id: checkoutId, deletedAt: null },
      select: { id: true, customerId: true, paymentCollectionId: true },
    });
    if (!checkout) throw new NotFoundException("checkout not found");
    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    if (!checkout.paymentCollectionId) {
      return { collection: null, payments: [] };
    }

    const collection = await this.prisma.paymentCollection.findFirst({
      where: { tenantId, id: checkout.paymentCollectionId, deletedAt: null },
      include: { payments: true },
    });
    if (!collection) return { collection: null, payments: [] };

    return { collection, payments: collection.payments };
  }
}
