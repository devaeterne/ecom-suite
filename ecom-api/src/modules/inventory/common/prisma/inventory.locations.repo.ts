import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class InventoryLocationsRepo {
  constructor(private readonly prisma: PrismaService) {}

  countActive(tenantId: string) {
    return this.prisma.inventoryLocation.count({
      where: { tenantId, deletedAt: null },
    });
  }

  async list(tenantId: string) {
    return this.prisma.inventoryLocation.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  async hasDefault(tenantId: string) {
    const n = await this.prisma.inventoryLocation.count({
      where: { tenantId, deletedAt: null, isDefault: true },
    });
    return n > 0;
  }

  async findOldestActive(tenantId: string) {
    return this.prisma.inventoryLocation.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  async findByIdOrThrow(tenantId: string, id: string) {
    const row = await this.prisma.inventoryLocation.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    if (!row) throw new NotFoundException("INVENTORY_LOCATION_NOT_FOUND");
    return row;
  }

  async create(params: {
    tenantId: string;
    name: string;
    code?: string | null;
    address?: any | null;
    metadata?: any;
    isDefault?: boolean;
  }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const activeCount = await tx.inventoryLocation.count({
          where: { tenantId: params.tenantId, deletedAt: null },
        });

        const defaultCount = await tx.inventoryLocation.count({
          where: {
            tenantId: params.tenantId,
            deletedAt: null,
            isDefault: true,
          },
        });

        const shouldBeDefault =
          activeCount === 0 || params.isDefault === true || defaultCount === 0;

        if (shouldBeDefault) {
          await tx.inventoryLocation.updateMany({
            where: { tenantId: params.tenantId, deletedAt: null },
            data: { isDefault: false },
          });
        }

        return tx.inventoryLocation.create({
          data: {
            tenantId: params.tenantId,
            name: params.name,
            code: params.code ?? null,
            address: params.address ?? null,
            metadata: params.metadata ?? {},
            isDefault: shouldBeDefault,
          },
        });
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new ConflictException("INVENTORY_LOCATION_CODE_CONFLICT");
      }
      throw e;
    }
  }

  async update(params: {
    tenantId: string;
    id: string;
    name?: string;
    code?: string | null;
    address?: any | null;
    metadata?: any;
  }) {
    await this.findByIdOrThrow(params.tenantId, params.id);

    try {
      return await this.prisma.inventoryLocation.update({
        where: { tenantId_id: { tenantId: params.tenantId, id: params.id } },
        data: {
          name: params.name,
          code: params.code,
          address: params.address,
          metadata: params.metadata,
        },
      });
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new ConflictException("INVENTORY_LOCATION_CODE_CONFLICT");
      }
      throw e;
    }
  }

  async softDelete(tenantId: string, id: string) {
    const row = await this.findByIdOrThrow(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryLocation.update({
        where: { tenantId_id: { tenantId, id } },
        data: { isDefault: false, deletedAt: new Date() },
      });

      if (row.isDefault) {
        const fallback = await tx.inventoryLocation.findFirst({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: "asc" },
        });

        if (fallback) {
          await tx.inventoryLocation.updateMany({
            where: { tenantId, deletedAt: null },
            data: { isDefault: false },
          });

          await tx.inventoryLocation.update({
            where: { tenantId_id: { tenantId, id: fallback.id } },
            data: { isDefault: true },
          });
        }
      }

      return { ok: true };
    });
  }

  /**
   * Tek default kuralı: transaction ile enforce.
   */
  async setDefault(tenantId: string, locationId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryLocation.updateMany({
        where: {
          tenantId,
          deletedAt: null,
          isDefault: true,
          id: { not: locationId },
        },
        data: { isDefault: false },
      });

      await tx.inventoryLocation.update({
        where: { id: locationId },
        data: { isDefault: true },
      });
    });
  }
}
