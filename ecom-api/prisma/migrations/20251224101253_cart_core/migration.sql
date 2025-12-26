-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CartAdjustmentType" AS ENUM ('DISCOUNT', 'SHIPPING', 'MANUAL');

-- AlterTable
ALTER TABLE "inventory_reservation" ADD COLUMN     "lineItemId" UUID;

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL,
    "customerId" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "regionId" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_line_item" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "skuSnapshot" TEXT,
    "titleSnapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceSnapshot" INTEGER NOT NULL,
    "compareAtSnapshot" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_adjustment" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "type" "CartAdjustmentType" NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (keep)
CREATE INDEX "cart_line_item_variantId_idx" ON "cart_line_item"("variantId");

-- CreateIndex (keep)
CREATE INDEX "cart_line_item_cartId_idx" ON "cart_line_item"("cartId");

-- CreateIndex (keep - UPSERT hedefi)
CREATE UNIQUE INDEX "cart_line_item_cartId_variantId_key" ON "cart_line_item"("cartId", "variantId");

-- CreateIndex (keep)
CREATE INDEX "cart_adjustment_cartId_type_idx" ON "cart_adjustment"("cartId", "type");

-- Optimized indexes for cart_core (manual)

-- 1) Customer'ın ACTIVE cart'ı (partial)
CREATE INDEX "idx_cart_customer_active"
ON "cart"("customerId")
WHERE "status" = 'ACTIVE' AND "customerId" IS NOT NULL;

-- (Opsiyonel) Customer başına tek ACTIVE cart istiyorsan aç:
-- CREATE UNIQUE INDEX "uq_cart_customer_active"
-- ON "cart"("customerId")
-- WHERE "status" = 'ACTIVE' AND "customerId" IS NOT NULL;

-- 2) Status + updatedAt DESC (admin/job listeleri)
CREATE INDEX "cart_status_updatedAt_idx"
ON "cart"("status", "updatedAt" DESC);

-- 3) Expire sweep (ACTIVE + expiresAt dolu)
CREATE INDEX "idx_cart_expires_at_active"
ON "cart"("expiresAt")
WHERE "status" = 'ACTIVE' AND "expiresAt" IS NOT NULL;

-- 4) Coupon code lookup (code doluysa)
CREATE INDEX "cart_adjustment_code_idx"
ON "cart_adjustment"("code")
WHERE "code" IS NOT NULL;

-- 5) Reservation -> line item lookup (lineItemId doluysa)
CREATE INDEX "idx_inventory_res_line_item"
ON "inventory_reservation"("lineItemId")
WHERE "lineItemId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_lineItemId_fkey"
FOREIGN KEY ("lineItemId") REFERENCES "cart_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_adjustment" ADD CONSTRAINT "cart_adjustment_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
