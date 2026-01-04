// src/modules/checkout/store/services/checkout.service.ts
import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PaymentProvider, CartStatus } from "@prisma/client";

import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";

import { CreateCheckoutDto } from "@/modules/checkout/store/dto/create-checkout.dto";
import { UpsertCheckoutAddressDto } from "@/modules/checkout/store/dto/upsert-checkout-address.dto";
import { StartPaymentDto } from "@/modules/checkout/store/dto/start-payment.dto";

import { CHECKOUT_DEFAULT_CURRENCY } from "@/modules/checkout/common/constants/checkout.constants";
import { getTenantIdOrThrow } from "@/modules/checkout/common/policies/checkout.tenancy";
import { getCustomerIdOrThrow } from "@/modules/checkout/common/policies/checkout.auth";
import { assertCheckoutOwnedByCustomer } from "@/modules/checkout/common/policies/checkout.ownership";

import { CheckoutRepo } from "@/modules/checkout/common/prisma/checkout.repo";
import { CheckoutMapper } from "@/modules/checkout/common/mappers/checkout.mapper";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: CheckoutRepo
  ) {}

  async createCheckout(ctx: StoreAuthContext, dto: CreateCheckoutDto) {
    const tenantId = getTenantIdOrThrow(ctx);
    const customerId = getCustomerIdOrThrow(ctx);
    const currencyCode = dto.currencyCode ?? CHECKOUT_DEFAULT_CURRENCY;

    const cart = await this.repo.resolveOrCreateCart({
      tenantId,
      customerId,
      cartId: dto.cartId ?? null,
      currencyCode,
    });

    // aktif cart garantisi (opsiyonel)
    if (cart.status !== CartStatus.ACTIVE) {
      // ileride: yeni cart açma / hata
    }

    const checkout = await this.repo.upsertCheckout({
      tenantId,
      customerId,
      cartId: cart.id,
      email: dto.email ?? null,
      currencyCode,
    });

    return {
      checkout: CheckoutMapper.toDetailedResponse(checkout),
    };
  }

  async upsertAddress(
    ctx: StoreAuthContext,
    checkoutId: string,
    dto: UpsertCheckoutAddressDto
  ) {
    const tenantId = getTenantIdOrThrow(ctx);
    const customerId = getCustomerIdOrThrow(ctx);

    await assertCheckoutOwnedByCustomer(this.prisma, {
      tenantId,
      checkoutId,
      customerId,
    });

    const address = await this.repo.upsertAddress({
      tenantId,
      checkoutId,
      type: dto.type, // "SHIPPING" | "BILLING"
      data: {
        fullName: dto.fullName ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        company: dto.company ?? null,
        line1: dto.line1,
        line2: dto.line2 ?? null,
        city: dto.city,
        province: dto.province ?? null,
        postalCode: dto.postalCode ?? null,
        countryIso2: dto.countryIso2,
        taxNo: dto.taxNo ?? null,
        taxOffice: dto.taxOffice ?? null,
      },
    });

    return { address };
  }

  async getAvailablePaymentProviders(
    ctx: StoreAuthContext,
    checkoutId: string
  ) {
    const tenantId = getTenantIdOrThrow(ctx);
    const customerId = getCustomerIdOrThrow(ctx);

    const checkout = await this.repo.getCheckoutOrThrow({
      tenantId,
      checkoutId,
    });

    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    const shipping =
      checkout.addresses.find((a: any) => a.type === "SHIPPING") ?? null;

    const countryIso2 = shipping?.countryIso2 ?? null;

    const base: Array<{ provider: PaymentProvider; reason: string }> = [
      { provider: PaymentProvider.MANUAL, reason: "bank transfer" },
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
    const enabledSet = new Set(enabled.map((x) => x.provider));

    const usable = base.filter(
      (x) => x.provider === PaymentProvider.MANUAL || enabledSet.has(x.provider)
    );

    return {
      providers: usable,
      countryIso2,
    };
  }

  async startPayment(
    ctx: StoreAuthContext,
    checkoutId: string,
    dto: StartPaymentDto
  ) {
    const tenantId = getTenantIdOrThrow(ctx);
    const customerId = getCustomerIdOrThrow(ctx);

    const checkout = await this.repo.getCheckoutOrThrow({
      tenantId,
      checkoutId,
    });

    if (checkout.customerId && checkout.customerId !== customerId) {
      throw new ForbiddenException("not your checkout");
    }

    const { providers } = await this.getAvailablePaymentProviders(
      ctx,
      checkoutId
    );

    if (!providers.find((p) => p.provider === dto.provider)) {
      throw new ForbiddenException("payment provider not available");
    }

    const payment = await this.repo.createPayment({
      tenantId,
      checkoutId: checkout.id,
      provider: dto.provider,
      currencyCode: checkout.currencyCode,
      amount: checkout.grandTotal,
      metadata: {
        returnUrl: dto.returnUrl ?? null,
        cancelUrl: dto.cancelUrl ?? null,
        locale: dto.locale ?? null,
      },
    });

    return { payment };
  }
}
