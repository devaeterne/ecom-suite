/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,variantId,price_list_id]` on the table `catalog_price_set` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "catalog_price_set" ADD COLUMN     "price_list_id" UUID;

-- CreateIndex
CREATE INDEX "idx_price_set_tenant_price_list" ON "catalog_price_set"("tenantId", "price_list_id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_price_set_variant_pricelist" ON "catalog_price_set"("tenantId", "variantId", "price_list_id");

-- AddForeignKey
ALTER TABLE "catalog_price_set" ADD CONSTRAINT "catalog_price_set_tenantId_price_list_id_fkey" FOREIGN KEY ("tenantId", "price_list_id") REFERENCES "price_list"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
