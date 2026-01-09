import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(args: {
    tenantId: string;
    data: { value: string; metadata?: Prisma.InputJsonValue };
  }) {
    return this.prisma.productTag.create({
      data: {
        tenantId: args.tenantId,
        value: args.data.value,
        metadata: (args.data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  findById(args: { tenantId: string; id: string }) {
    return this.prisma.productTag.findFirst({
      where: { tenantId: args.tenantId, id: args.id },
    });
  }

  findByValue(args: { tenantId: string; value: string }) {
    return this.prisma.productTag.findFirst({
      where: { tenantId: args.tenantId, value: args.value },
    });
  }

  async findMany(args: {
    tenantId: string;
    q?: string;
    offset: number;
    limit: number;
  }) {
    const where: Prisma.ProductTagWhereInput = {
      tenantId: args.tenantId,
      ...(args.q ? { value: { contains: args.q, mode: "insensitive" } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.productTag.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: args.offset,
        take: args.limit,
      }),
      this.prisma.productTag.count({ where }),
    ]);

    return { items, total };
  }

  update(args: {
    tenantId: string;
    id: string;
    data: Partial<{ value: string; metadata: Prisma.InputJsonValue }>;
  }) {
    return this.prisma.productTag.update({
      where: { tenantId_id: { tenantId: args.tenantId, id: args.id } },
      data: {
        ...(args.data.value !== undefined ? { value: args.data.value } : {}),
        ...(args.data.metadata !== undefined
          ? { metadata: args.data.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  delete(args: { tenantId: string; id: string }) {
    return this.prisma.productTag.delete({
      where: { tenantId_id: { tenantId: args.tenantId, id: args.id } },
    });
  }
}
