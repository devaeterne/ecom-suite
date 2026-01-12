import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDiscountDto } from "../dto/discount.dto";
import { DiscountType } from "@prisma/client";

@Injectable()
export class DiscountsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDiscountDto) {
    return this.prisma.discount.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name, // ✅ required field
        type: dto.type, // ✅ Prisma enum
        value: dto.value,
        metadata: {
          minSubtotal: dto.minSubtotal ?? null,
        },
      },
    });
  }

  list(tenantId: string) {
    return this.prisma.discount.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
