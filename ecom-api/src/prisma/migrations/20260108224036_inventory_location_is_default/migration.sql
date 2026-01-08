-- AlterTable
ALTER TABLE "inventory_location" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_inventory_location_tenant_default" ON "inventory_location"("tenantId", "isDefault");
