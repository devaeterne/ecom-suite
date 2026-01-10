/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `product_category_translation` table. All the data in the column will be lost.
  - You are about to drop the column `handle` on the `product_category_translation` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `product_category_translation` table. All the data in the column will be lost.
  - Added the required column `title` to the `product_category_translation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "idx_category_translation_tenant_deleted_at";

-- DropIndex
DROP INDEX "product_category_translation_tenantId_id_key";

-- DropIndex
DROP INDEX "product_category_translation_tenantId_idx";

-- DropIndex
DROP INDEX "uniq_category_locale_handle";

-- AlterTable
ALTER TABLE "product_category_translation" DROP COLUMN "deletedAt",
DROP COLUMN "handle",
DROP COLUMN "name",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "product_translation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "searchKeywords" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_product_translation_locale" ON "product_translation"("tenantId", "locale");

-- CreateIndex
CREATE INDEX "idx_product_translation_product" ON "product_translation"("tenantId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_translation" ON "product_translation"("tenantId", "productId", "locale");

-- CreateIndex
CREATE INDEX "idx_product_category_translation_locale" ON "product_category_translation"("tenantId", "localeCode");

-- CreateIndex
CREATE INDEX "idx_product_category_translation_category" ON "product_category_translation"("tenantId", "categoryId");

-- AddForeignKey
ALTER TABLE "product_translation" ADD CONSTRAINT "product_translation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_translation" ADD CONSTRAINT "product_translation_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "uniq_category_translation_locale" RENAME TO "uniq_product_category_translation";
