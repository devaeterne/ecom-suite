/*
  Warnings:

  - You are about to drop the column `altText` on the `product_media` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `product_media` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `product_media` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `product_media` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,productId,fileId]` on the table `product_media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileId` to the `product_media` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductMediaRole" AS ENUM ('GALLERY', 'THUMBNAIL', 'HERO');

-- DropIndex
DROP INDEX "idx_product_media_deleted_at";

-- DropIndex
DROP INDEX "idx_product_media_product_rank";

-- DropIndex
DROP INDEX "product_media_tenantId_id_key";

-- DropIndex
DROP INDEX "product_media_tenantId_idx";

-- AlterTable
ALTER TABLE "product_media" DROP COLUMN "altText",
DROP COLUMN "deletedAt",
DROP COLUMN "type",
DROP COLUMN "url",
ADD COLUMN     "fileId" UUID NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "ProductMediaRole" NOT NULL DEFAULT 'GALLERY';

-- CreateIndex
CREATE INDEX "product_media_tenantId_productId_idx" ON "product_media"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "product_media_tenantId_fileId_idx" ON "product_media"("tenantId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_tenantId_productId_fileId_key" ON "product_media"("tenantId", "productId", "fileId");

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_tenantId_fileId_fkey" FOREIGN KEY ("tenantId", "fileId") REFERENCES "file_object"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_media_one_thumbnail
ON "product_media" ("tenantId","productId")
WHERE "role" = 'THUMBNAIL';

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_media_one_hero
ON "product_media" ("tenantId","productId")
WHERE "role" = 'HERO';
