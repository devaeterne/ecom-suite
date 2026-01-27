/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,handle]` on the table `catalog_product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "RoleScope" ADD VALUE 'SUPER_ADMIN';

-- CreateIndex
CREATE UNIQUE INDEX "uq_catalog_product_tenant_handle" ON "catalog_product"("tenantId", "handle");
