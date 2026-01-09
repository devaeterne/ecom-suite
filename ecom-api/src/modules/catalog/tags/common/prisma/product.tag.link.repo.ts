import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ProductTagLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTagIdsByProduct(args: { tenantId: string; productId: string }) {
    return this.prisma.productTagLink.findMany({
      where: { tenantId: args.tenantId, productId: args.productId },
      select: { tagId: true },
    });
  }
}
