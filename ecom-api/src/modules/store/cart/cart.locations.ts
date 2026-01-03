import { PrismaClient } from "@prisma/client";
import { DEFAULT_INVENTORY_LOCATION_CODE } from "@modules/store/cart/cart.contants";

/**
 * Location seçimi: code="default" => yoksa ilk aktif (deletedAt=null)
 */
export async function resolveDefaultInventoryLocationId(
  prisma: PrismaClient,
  tenantId: string
): Promise<string> {
  const byCode = await prisma.inventoryLocation.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      code: DEFAULT_INVENTORY_LOCATION_CODE,
    },
    select: { id: true },
  });
  if (byCode) return byCode.id;

  const fallback = await prisma.inventoryLocation.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!fallback) {
    throw new Error(
      `No InventoryLocation found for tenantId=${tenantId}. Create one (code="default") or any active location.`
    );
  }
  return fallback.id;
}
