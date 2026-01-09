import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ProductTagsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async replaceTags(args: {
    tenantId: string;
    productId: string;
    tagIds: string[];
  }) {
    const { tenantId, productId } = args;

    const product = await this.prisma.catalogProduct.findFirst({
      where: { tenantId, id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException("Product not found.");

    const uniqueTagIds = Array.from(new Set(args.tagIds));
    const tags = await this.prisma.productTag.findMany({
      where: { tenantId, id: { in: uniqueTagIds } },
      select: { id: true },
    });
    if (tags.length !== uniqueTagIds.length) {
      throw new NotFoundException("One or more tags not found.");
    }

    const current = await this.prisma.productTagLink.findMany({
      where: { tenantId, productId },
      select: { tagId: true },
    });

    const currentIds = new Set<string>(current.map((x) => x.tagId));
    const targetIds = new Set<string>(uniqueTagIds);

    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const id of uniqueTagIds) if (!currentIds.has(id)) toAdd.push(id);
    for (const id of currentIds) if (!targetIds.has(id)) toRemove.push(id);

    await this.prisma.$transaction(async (tx) => {
      if (toRemove.length) {
        await tx.productTagLink.deleteMany({
          where: { tenantId, productId, tagId: { in: toRemove } },
        });
      }
      if (toAdd.length) {
        await tx.productTagLink.createMany({
          data: toAdd.map((tagId) => ({ tenantId, productId, tagId })),
          skipDuplicates: true,
        });
      }
    });

    return { ok: true, added: toAdd.length, removed: toRemove.length };
  }
}
