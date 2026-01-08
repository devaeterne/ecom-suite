/*
  Warnings:

  - Changed the type of `entityType` on the `file_link` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "FileEntityType" AS ENUM ('catalog_product', 'catalog_variant', 'product_category', 'order');

-- AlterTable
ALTER TABLE "file_link" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "FileEntityType" NOT NULL;

-- AlterTable
ALTER TABLE "file_object" ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'UPLOADING';

-- CreateIndex
CREATE INDEX "idx_file_link_tenant_entity_sort" ON "file_link"("tenantId", "entityType", "entityId", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_file_link_entity_file_role" ON "file_link"("tenantId", "entityType", "entityId", "fileId", "role");

-- CreateIndex
CREATE INDEX "idx_file_object_tenant_status" ON "file_object"("tenantId", "status");
