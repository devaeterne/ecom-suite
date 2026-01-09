import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class CollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(args: {
    tenantId: string;
    data: {
      title: string;
      handle: string;
      metadata?: Prisma.InputJsonValue; // ✅ JsonValue değil
    };
  }) {
    return this.prisma.productCollection.create({
      data: {
        tenantId: args.tenantId,
        title: args.data.title,
        handle: args.data.handle,
        metadata: (args.data.metadata ?? {}) as Prisma.InputJsonValue, // ✅
      },
    });
  }

  findById(args: { tenantId: string; id: string }) {
    return this.prisma.productCollection.findFirst({
      where: { tenantId: args.tenantId, id: args.id },
    });
  }

  findByHandle(args: { tenantId: string; handle: string }) {
    return this.prisma.productCollection.findFirst({
      where: { tenantId: args.tenantId, handle: args.handle },
    });
  }

  async findMany(args: {
    tenantId: string;
    q?: string;
    offset: number;
    limit: number;
  }) {
    const where: Prisma.ProductCollectionWhereInput = {
      tenantId: args.tenantId,
      ...(args.q
        ? {
            OR: [
              { title: { contains: args.q, mode: "insensitive" } },
              { handle: { contains: args.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productCollection.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: args.offset,
        take: args.limit,
      }),
      this.prisma.productCollection.count({ where }),
    ]);

    return { items, total };
  }

  update(args: {
    tenantId: string;
    id: string;
    data: Partial<{
      title: string;
      handle: string;
      metadata: Prisma.InputJsonValue; // ✅
    }>;
  }) {
    return this.prisma.productCollection.update({
      where: {
        tenantId_id: { tenantId: args.tenantId, id: args.id },
      },
      data: {
        ...(args.data.title !== undefined ? { title: args.data.title } : {}),
        ...(args.data.handle !== undefined ? { handle: args.data.handle } : {}),
        ...(args.data.metadata !== undefined
          ? { metadata: args.data.metadata as Prisma.InputJsonValue } // ✅
          : {}),
      },
    });
  }

  delete(args: { tenantId: string; id: string }) {
    return this.prisma.productCollection.delete({
      where: {
        tenantId_id: { tenantId: args.tenantId, id: args.id },
      },
    });
  }
}
