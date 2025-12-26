-- CreateTable
CREATE TABLE "inventory_location" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_level" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "stocked" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservation" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMPTZ(6),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_inventory_location_code" ON "inventory_location"("code");

-- CreateIndex
CREATE INDEX "idx_inventory_location_deleted_at" ON "inventory_location"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_inventory_level_variant" ON "inventory_level"("variantId");

-- CreateIndex
CREATE INDEX "idx_inventory_level_location" ON "inventory_level"("locationId");

-- CreateIndex
CREATE INDEX "idx_inventory_level_deleted_at" ON "inventory_level"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_inventory_res_variant" ON "inventory_reservation"("variantId");

-- CreateIndex
CREATE INDEX "idx_inventory_res_location" ON "inventory_reservation"("locationId");

-- CreateIndex
CREATE INDEX "idx_inventory_res_status" ON "inventory_reservation"("status");

-- CreateIndex
CREATE INDEX "idx_inventory_res_expires_at" ON "inventory_reservation"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_inventory_res_reference" ON "inventory_reservation"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "idx_inventory_res_deleted_at" ON "inventory_reservation"("deletedAt");

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_inventory_location_code_active"
ON "inventory_location" ("code")
WHERE "deletedAt" IS NULL;

-- One active inventory level per (variant, location)
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_inventory_level_variant_location_active"
ON "inventory_level" ("variantId", "locationId")
WHERE "deletedAt" IS NULL AND "isActive" = true;