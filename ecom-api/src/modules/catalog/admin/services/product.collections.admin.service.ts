import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ProductCollectionsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async replaceCollections(args: {
    tenantId: string;
    productId: string;
    collectionIds: string[];
  }) {
    const { tenantId, productId } = args;

    // 1) product exists (tenant scoped)
    const product = await this.prisma.catalogProduct.findFirst({
      where: { tenantId, id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found.");

    // 2) validate collections belong to tenant
    const uniqueIds = Array.from(new Set(args.collectionIds));
    if (uniqueIds.length) {
      const collections = await this.prisma.productCollection.findMany({
        where: { tenantId, id: { in: uniqueIds } },
        select: { id: true },
      });
      if (collections.length !== uniqueIds.length) {
        throw new NotFoundException("One or more collections not found.");
      }
    }

    // 3) current set
    const current = await this.prisma.productCollectionLink.findMany({
      where: { tenantId, productId },
      select: { collectionId: true },
    });

    const currentIds = new Set<string>(current.map((x) => x.collectionId));
    const targetIds = new Set<string>(uniqueIds);

    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const id of uniqueIds) if (!currentIds.has(id)) toAdd.push(id);
    for (const id of currentIds) if (!targetIds.has(id)) toRemove.push(id);

    // 4) transaction: remove then add
    await this.prisma.$transaction(async (tx) => {
      if (toRemove.length) {
        await tx.productCollectionLink.deleteMany({
          where: { tenantId, productId, collectionId: { in: toRemove } },
        });
      }
      if (toAdd.length) {
        await tx.productCollectionLink.createMany({
          data: toAdd.map((collectionId) => ({
            tenantId,
            productId,
            collectionId,
          })),
          skipDuplicates: true, // uniq_product_collection_link ile uyumlu
        });
      }
    });

    return { ok: true, added: toAdd.length, removed: toRemove.length };
  }
}
