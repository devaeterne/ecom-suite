import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";
import { PaymentsRepo } from "@/modules/payments/common/prisma/payments.repo";
import { StorePaymentDto } from "@/modules/payments/store/dto/store-payment.dto";

import { CheckoutStatus, PaymentProvider } from "@prisma/client";

import {
  toCollectionAndLatestPayment,
  toPaymentCollectionResponse,
  toPaymentStatusResponse,
} from "@/modules/payments/common/mappers/payments.mapper";

function requireString(v: any, name: string) {
  if (!v || typeof v !== "string")
    throw new BadRequestException(`${name} missing`);
  return v;
}

@Injectable()
export class PaymentsStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: PaymentsRepo
  ) {}

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

  async startPayment(req: any, dto: StorePaymentDto) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    const checkoutId = dto.checkoutId;
    const provider = dto.provider;
    const idempotencyKey = dto.idempotencyKey;

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

    const { collection, payment } = await this.repo.transaction(async (tx) => {
      const collection = await this.repo.upsertPaymentCollection(tx, {
        tenantId,
        idempotencyKey,
        amount: checkout.grandTotal,
        currencyCode: checkout.currencyCode,
        metadata: {
          checkoutId,
          returnUrl: dto.returnUrl ?? null,
          cancelUrl: dto.cancelUrl ?? null,
          locale: dto.locale ?? null,
          customerId,
        },
      });

      await this.repo.attachCollectionToCheckout(tx, {
        tenantId,
        checkoutId,
        collectionId: collection.id,
      });

      const payment = await this.repo.createPayment(tx, {
        tenantId,
        collectionId: collection.id,
        provider,
        amount: checkout.grandTotal,
        currencyCode: checkout.currencyCode,
        metadata: { checkoutId, customerId },
      });

      return { collection, payment };
    });

    return { collection: toPaymentCollectionResponse({ collection, payment }) };
  }

  async getCheckoutPaymentCollection(req: any, checkoutId: string) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    return this.repo.transaction(async (tx) => {
      const ref = await this.repo.getCheckoutPaymentCollectionRef(tx, {
        tenantId,
        checkoutId,
      });

      if (!ref) throw new NotFoundException("checkout not found");
      if (ref.customerId && ref.customerId !== customerId) {
        throw new ForbiddenException("not your checkout");
      }

      if (!ref.paymentCollectionId) {
        return { collection: null };
      }

      const collection = await this.repo.getPaymentCollectionWithPayments(tx, {
        tenantId,
        collectionId: ref.paymentCollectionId,
      });

      if (!collection) return { collection: null };

      const { latest } = toCollectionAndLatestPayment({ collection });
      return {
        collection: toPaymentCollectionResponse({
          collection,
          payment: latest,
        }),
      };
    });
  }

  // İstersen controller'a ekleriz: /checkouts/:id/status
  async getCheckoutPaymentStatus(req: any, checkoutId: string) {
    const tenantId = this.getTenantIdFromReq(req);
    const customerId = this.getCustomerIdFromReq(req);

    return this.repo.transaction(async (tx) => {
      const ref = await this.repo.getCheckoutPaymentCollectionRef(tx, {
        tenantId,
        checkoutId,
      });

      if (!ref) throw new NotFoundException("checkout not found");
      if (ref.customerId && ref.customerId !== customerId) {
        throw new ForbiddenException("not your checkout");
      }
      if (!ref.paymentCollectionId) {
        return {
          status: toPaymentStatusResponse({
            collectionId: "none",
            payment: null,
          }),
        };
      }

      const collection = await this.repo.getPaymentCollectionWithPayments(tx, {
        tenantId,
        collectionId: ref.paymentCollectionId,
      });
      if (!collection) {
        return {
          status: toPaymentStatusResponse({
            collectionId: ref.paymentCollectionId,
            payment: null,
          }),
        };
      }

      const { latest } = toCollectionAndLatestPayment({ collection });
      return {
        status: toPaymentStatusResponse({
          collectionId: collection.id,
          payment: latest,
        }),
      };
    });
  }
}
