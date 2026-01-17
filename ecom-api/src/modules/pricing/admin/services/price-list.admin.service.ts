// src/modules/pricing/admin/services/price-lists.admin.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PriceListType } from "@prisma/client";
import { UpdatePriceListDto } from "../dto/price-list.dto";

@Injectable()
export class PriceListsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.priceList.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(
    tenantId: string,
    dto: { title: string; type?: PriceListType; isActive?: boolean },
  ) {
    return this.prisma.priceList.create({
      data: {
        tenantId,
        title: dto.title,
        type: dto.type ?? PriceListType.SALE,
        isActive: dto.isActive ?? false,
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

  async update(tenantId: string, id: string, dto: UpdatePriceListDto) {
    const exists = await this.prisma.priceList.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!exists) throw new NotFoundException("PriceList not found");

    return this.prisma.priceList.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        type: dto.type ?? undefined,
        isActive: dto.isActive ?? undefined,
        startsAt:
          dto.startsAt === undefined
            ? undefined
            : dto.startsAt
              ? new Date(dto.startsAt)
              : null,
        endsAt:
          dto.endsAt === undefined
            ? undefined
            : dto.endsAt
              ? new Date(dto.endsAt)
              : null,
      },
    });
  }
  async remove(tenantId: string, id: string) {
    const exists = await this.prisma.priceList.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!exists) throw new NotFoundException("PriceList not found");

    // öneri: soft delete (audit + geri dönüş için)
    await this.prisma.priceList.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { ok: true };
  }
}
