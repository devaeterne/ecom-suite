import { PrismaClient } from "@prisma/client";
import { DEFAULT_INVENTORY_LOCATION_CODE } from "@/modules/cart/common/constants/cart.constants";

/**
 * Location seçimi (deterministic):
 * 1) isDefault=true (ve deletedAt=null) => tek olmalı (migration ile garanti)
 * 2) code="default" (legacy/seed uyumluluğu)
 * 3) fallback: en eski aktif lokasyon
 *
 * Not: set-default endpoint isDefault flip yapıyor; bu yüzden isDefault her zaman birincil kaynak olmalı.
 */
export async function resolveDefaultInventoryLocationId(
  prisma: PrismaClient,
  tenantId: string
): Promise<string> {
  // 1) ✅ yeni gerçek: isDefault
  const byFlag = await prisma.inventoryLocation.findFirst({
    where: { tenantId, deletedAt: null, isDefault: true },
    select: { id: true },
  });
  if (byFlag) return byFlag.id;

  // 2) legacy: code="default"
  const byCode = await prisma.inventoryLocation.findFirst({
    where: {
      tenantId,
      deletedAt: null,
      code: DEFAULT_INVENTORY_LOCATION_CODE,
    },
    select: { id: true },
  });
  if (byCode) return byCode.id;

  // 3) fallback
  const fallback = await prisma.inventoryLocation.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!fallback) {
    throw new Error(
      `No InventoryLocation found for tenantId=${tenantId}. Create one (isDefault=true or code="default") or any active location.`
    );
  }
  return fallback.id;
}
