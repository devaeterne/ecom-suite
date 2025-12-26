-- CreateTable
CREATE TABLE "catalog_product_variant" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "ean" TEXT,
    "upc" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "manageInventory" BOOLEAN NOT NULL DEFAULT true,
    "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER,
    "length" INTEGER,
    "height" INTEGER,
    "width" INTEGER,
    "externalRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "catalog_product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_catalog_variant_product" ON "catalog_product_variant"("productId");

-- CreateIndex
CREATE INDEX "idx_catalog_variant_deleted_at" ON "catalog_product_variant"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_catalog_variant_sku" ON "catalog_product_variant"("sku");

-- CreateIndex
CREATE INDEX "idx_catalog_variant_barcode" ON "catalog_product_variant"("barcode");

-- CreateIndex
CREATE INDEX "idx_catalog_variant_external_ref" ON "catalog_product_variant"("externalRef");

-- AddForeignKey
ALTER TABLE "catalog_product_variant" ADD CONSTRAINT "catalog_product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Active-only unique SKU (soft delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_catalog_variant_sku_active"
ON "catalog_product_variant" ("sku")
WHERE "deletedAt" IS NULL;

-- Only one default variant per product (active)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_catalog_variant_default_true"
ON "catalog_product_variant" ("productId")
WHERE "isDefault" = true AND "deletedAt" IS NULL;