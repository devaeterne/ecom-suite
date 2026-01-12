// src/modules/pricing/admin/services/price-lists.admin.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PriceListType } from "@prisma/client";

@Injectable()
export class PriceListsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.priceList.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(tenantId: string, dto: { title: string; type?: PriceListType }) {
    return this.prisma.priceList.create({
      data: {
        tenantId,
        title: dto.title,
        type: dto.type ?? PriceListType.SALE,
        isActive: false,
      },
    });
  }

  async activate(tenantId: string, id: string) {
    const list = await this.prisma.priceList.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!list) throw new NotFoundException("PriceList not found");

    return this.prisma.priceList.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(tenantId: string, id: string) {
    const list = await this.prisma.priceList.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!list) throw new NotFoundException("PriceList not found");

    return this.prisma.priceList.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
