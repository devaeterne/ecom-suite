-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "catalog_product" (
    "id" UUID NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMPTZ(6),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "searchKeywords" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "brand" TEXT,
    "type" TEXT,
    "externalRef" TEXT,
    "thumbnailUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "catalog_product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_catalog_product_status" ON "catalog_product"("status");

-- CreateIndex
CREATE INDEX "idx_catalog_product_rank_updated" ON "catalog_product"("rank", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_catalog_product_published_at" ON "catalog_product"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_catalog_product_external_ref" ON "catalog_product"("externalRef");

-- CreateIndex
CREATE INDEX "idx_catalog_product_deleted_at" ON "catalog_product"("deletedAt");
-- Active-only unique handle (soft delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_catalog_product_handle_active"
ON "catalog_product" ("handle")
WHERE "deletedAt" IS NULL;