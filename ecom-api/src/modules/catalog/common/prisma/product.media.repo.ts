import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, ProductMediaRole } from "@prisma/client";

@Injectable()
export class ProductMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByProduct(tenantId: string, productId: string) {
    return this.prisma.productMedia.findMany({
      where: { tenantId, productId },
      orderBy: [{ role: "asc" }, { rank: "asc" }, { createdAt: "asc" }],
    });
  }

  async create(
    tx: Prisma.TransactionClient,
    data: Prisma.ProductMediaCreateInput
  ) {
    return tx.productMedia.create({ data });
  }

  async deleteById(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productId: string,
    id: string
  ) {
    return tx.productMedia.deleteMany({
      where: { tenantId, productId, id },
    });
  }

  async deleteRoleSingleton(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productId: string,
    role: ProductMediaRole
  ) {
    // HERO/THUMBNAIL tekilliği için “replace semantics”
    return tx.productMedia.deleteMany({
      where: { tenantId, productId, role },
    });
  }

  async updateById(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productId: string,
    id: string,
    data: Prisma.ProductMediaUpdateInput
  ) {
    const res = await tx.productMedia.updateMany({
      where: { tenantId, productId, id },
      data,
    });
    if (res.count === 0) return null;

    return tx.productMedia.findFirst({ where: { tenantId, id } });
  }

  async findById(tenantId: string, id: string) {
    // ProductMedia’da tenantId_id unique yok → findFirst kullan
    return this.prisma.productMedia.findFirst({
      where: { tenantId, id },
    });
  }

  async getMaxGalleryRank(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productId: string
  ) {
    const res = await tx.productMedia.aggregate({
      where: { tenantId, productId, role: "GALLERY" },
      _max: { rank: true },
    });
    return res._max?.rank ?? 0;
  }
}
