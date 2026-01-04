// src/modules/checkout/common/prisma/checkout.repo.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  Prisma,
  PaymentProvider,
  PaymentStatus,
  CheckoutStatus,
  CartStatus,
} from "@prisma/client";
import { CHECKOUT_ERRORS } from "@/modules/checkout/common/constants/checkout.constants";
import type { CheckoutAddressType } from "@/modules/checkout/common/types/checkout.types";

@Injectable()
export class CheckoutRepo {
  constructor(private readonly prisma: PrismaService) {}

  async resolveOrCreateCart(args: {
    tenantId: string;
    customerId: string;
    cartId?: string | null;
    currencyCode: string;
  }) {
    const existingCart = args.cartId
      ? await this.prisma.cart.findFirst({
          where: { tenantId: args.tenantId, id: args.cartId, deletedAt: null },
        })
      : await this.prisma.cart.findFirst({
          where: {
            tenantId: args.tenantId,
            customerId: args.customerId,
            status: CartStatus.ACTIVE,
            deletedAt: null,
          },
          orderBy: { updatedAt: "desc" },
        });

    const cart =
      existingCart ??
      (await this.prisma.cart.create({
        data: {
          tenantId: args.tenantId,
          customerId: args.customerId,
          status: CartStatus.ACTIVE,
          currencyCode: args.currencyCode,
        },
      }));

    return cart;
  }

  async upsertCheckout(args: {
    tenantId: string;
    customerId: string;
    cartId: string;
    email?: string | null;
    currencyCode: string;
  }) {
    return this.prisma.checkout.upsert({
      where: {
        tenantId_cartId: { tenantId: args.tenantId, cartId: args.cartId },
      },
      update: {
        email: args.email ?? undefined,
        currencyCode: args.currencyCode,
      },
      create: {
        tenantId: args.tenantId,
        cartId: args.cartId,
        customerId: args.customerId,
        email: args.email ?? undefined,
        currencyCode: args.currencyCode,
        status: CheckoutStatus.OPEN,
      },
      include: { addresses: true, cart: true },
    });
  }

  async upsertAddress(args: {
    tenantId: string;
    checkoutId: string;
    type: CheckoutAddressType;
    data: {
      fullName?: string | null;
      phone?: string | null;
      email?: string | null;
      company?: string | null;
      line1: string;
      line2?: string | null;
      city: string;
      province?: string | null;
      postalCode?: string | null;
      countryIso2: string;
      taxNo?: string | null;
      taxOffice?: string | null;
    };
  }) {
    // country check
    const c = await this.prisma.country.findUnique({
      where: { iso2: args.data.countryIso2 },
      select: { iso2: true },
    });
    if (!c)
      throw new BadRequestException(
        `${CHECKOUT_ERRORS.UNKNOWN_COUNTRY}: ${args.data.countryIso2}`
      );

    /**
     * Prisma upsert için unique lazım.
     * Eğer schema'da @@unique([tenantId, checkoutId, type]) yoksa:
     * - upsert yerine findFirst + update/create yapıyoruz (migration gerektirmeden).
     */
    const existing = await this.prisma.checkoutAddress.findFirst({
      where: {
        tenantId: args.tenantId,
        checkoutId: args.checkoutId,
        type: args.type as any, // db enum/string farkı varsa uyum
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.checkoutAddress.update({
        where: { id: existing.id },
        data: {
          ...args.data,
          type: args.type as any,
        },
      });
    }

    // create: UncheckedCreateInput ile relation zorunluluğunu bypass ederiz (tenant/checkout/country relation beklemez)
    return this.prisma.checkoutAddress.create({
      data: {
        tenantId: args.tenantId,
        checkoutId: args.checkoutId,
        type: args.type as any,
        ...args.data,
      } as Prisma.CheckoutAddressUncheckedCreateInput,
    });
  }

  async createPayment(args: {
    tenantId: string;
    checkoutId: string;
    provider: PaymentProvider;
    currencyCode: string;
    amount: number;
    metadata?: Record<string, unknown>;
  }) {
    const metadata = (args.metadata ?? {}) as Prisma.InputJsonValue;

    return this.prisma.orderPayment.create({
      data: {
        tenantId: args.tenantId,
        checkoutId: args.checkoutId,
        provider: args.provider,
        status: PaymentStatus.PENDING,
        amount: args.amount,
        totalAmount: args.amount,
        currencyCode: args.currencyCode,
        metadata,
      },
    });
  }

  async getCheckoutOrThrow(args: { tenantId: string; checkoutId: string }) {
    const checkout = await this.prisma.checkout.findFirst({
      where: { tenantId: args.tenantId, id: args.checkoutId, deletedAt: null },
      include: { cart: true, addresses: true },
    });
    if (!checkout)
      throw new NotFoundException(CHECKOUT_ERRORS.CHECKOUT_NOT_FOUND);
    return checkout;
  }
}
