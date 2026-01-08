import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class InventoryLocationsPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async resolveLocationId(
    tenantId: string,
    locationId?: string
  ): Promise<string> {
    if (locationId) {
      const loc = await this.prisma.inventoryLocation.findFirst({
        where: { tenantId, id: locationId, deletedAt: null },
        select: { id: true },
      });
      if (!loc) throw new NotFoundException("INVENTORY_LOCATION_NOT_FOUND");
      return loc.id;
    }

    // önce default
    const def = await this.prisma.inventoryLocation.findFirst({
      where: { tenantId, deletedAt: null, isDefault: true },
      select: { id: true },
    });
    if (def) return def.id;

    // fallback: ilk location
    const first = await this.prisma.inventoryLocation.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!first) throw new NotFoundException("INVENTORY_LOCATION_REQUIRED");
    return first.id;
  }
}
