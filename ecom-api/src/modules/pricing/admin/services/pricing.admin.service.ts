// src/modules/pricing/admin/services/pricing.admin.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateVariantPriceDto,
  UpdateVariantPriceDto,
} from "../dto/variant-price.dto";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type ResolvedUnitPrice = {
  amount: number; // minor units
  compareAt?: number | null;
};

@Injectable()
export class PricingAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async addVariantPrice(
    tenantId: string,
    variantId: string,
    dto: CreateVariantPriceDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.catalogProductVariant.findFirst({
        where: { tenantId, id: variantId },
        select: { id: true },
      });

      if (!variant) throw new NotFoundException("Variant not found");

      const normalizedPriceListId = dto.priceListId ?? null;

      const existing = await tx.catalogPriceSet.findFirst({
        where: {
          tenantId,
          variantId,
          priceListId: normalizedPriceListId,
          deletedAt: null,
        },
        select: { id: true },
      });

      const priceSet = existing
        ? await tx.catalogPriceSet.update({
            where: { id: existing.id },
            data: { isActive: true, deletedAt: null },
            select: { id: true },
          })
        : await tx.catalogPriceSet.create({
            data: {
              tenantId,
              variantId,
              isActive: true,
              priceListId: normalizedPriceListId,
              metadata: {},
            },
            select: { id: true },
          });

      return tx.catalogMoneyAmount.create({
        data: {
          tenantId,
          priceSetId: priceSet.id,
          currencyCode: dto.currencyCode,
          amount: dto.amount,
          compareAt: dto.compareAt ?? null,
          minQuantity: dto.minQuantity ?? null,
          maxQuantity: dto.maxQuantity ?? null,
          isActive: true,
          metadata: {},
        },
      });
    });
  }

  async listVariantPrices(tenantId: string, variantId: string) {
    return this.prisma.catalogMoneyAmount.findMany({
      where: {
        tenantId,
        deletedAt: null,
        priceSet: {
          tenantId,
          variantId,
          deletedAt: null,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        priceSet: {
          select: {
            priceListId: true,
          },
        },
      },
    });
  }

  async resolveUnitPrice(
    tx: Tx,
    args: {
      tenantId: string;
      cartId: string; // future use
      variantId: string;
      currencyCode: string;
      quantity: number;
      priceListId?: string | null; // ✅ NEW
    },
  ): Promise<ResolvedUnitPrice | null> {
    const { tenantId, variantId, currencyCode, quantity } = args;
    const priceListId = args.priceListId ?? null;

    const tierWhere = {
      tenantId,
      currencyCode,
      isActive: true,
      deletedAt: null,
      AND: [
        { OR: [{ minQuantity: null }, { minQuantity: { lte: quantity } }] },
        { OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }] },
      ],
    } satisfies Prisma.CatalogMoneyAmountWhereInput;

    const orderBy = [
      { minQuantity: "desc" as const },
      { createdAt: "desc" as const },
    ];

    // 1) scoped (priceListId) — sadece priceListId verilmişse
    if (priceListId) {
      const scoped = await tx.catalogMoneyAmount.findFirst({
        where: {
          ...tierWhere,
          priceSet: {
            tenantId,
            variantId,
            isActive: true,
            deletedAt: null,
            priceListId, // ✅ scoped
            // opsiyonel ama önerilir: price list aktif mi?
            priceList: {
              tenantId,
              deletedAt: null,
              isActive: true,
              AND: [
                { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
                { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
              ],
            },
          },
        },
        orderBy,
        select: { amount: true, compareAt: true },
      });

      if (scoped)
        return { amount: scoped.amount, compareAt: scoped.compareAt ?? null };
    }

    // 2) base fallback (priceListId = null)
    const base = await tx.catalogMoneyAmount.findFirst({
      where: {
        ...tierWhere,
        priceSet: {
          tenantId,
          variantId,
          isActive: true,
          deletedAt: null,
          priceListId: null, // ✅ base
        },
      },
      orderBy,
      select: { amount: true, compareAt: true },
    });

    if (!base) return null;
    return { amount: base.amount, compareAt: base.compareAt ?? null };
  }
  async updateVariantPrice(
    tenantId: string,
    variantId: string,
    priceId: string,
    dto: UpdateVariantPriceDto,
  ) {
    const price = await this.prisma.catalogMoneyAmount.findFirst({
      where: {
        id: priceId,
        tenantId,
        deletedAt: null,
        priceSet: {
          variantId,
          tenantId,
        },
      },
    });

    if (!price) throw new NotFoundException("Price not found");

    return this.prisma.catalogMoneyAmount.update({
      where: { id: priceId },
      data: {
        amount: dto.amount ?? undefined,
        compareAt: dto.compareAt ?? undefined,
        currencyCode: dto.currencyCode ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async removeVariantPrice(
    tenantId: string,
    variantId: string,
    priceId: string,
  ) {
    const price = await this.prisma.catalogMoneyAmount.findFirst({
      where: {
        id: priceId,
        tenantId,
        deletedAt: null,
        priceSet: {
          variantId,
          tenantId,
        },
      },
    });

    if (!price) throw new NotFoundException("Price not found");

    return this.prisma.catalogMoneyAmount.update({
      where: { id: priceId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
