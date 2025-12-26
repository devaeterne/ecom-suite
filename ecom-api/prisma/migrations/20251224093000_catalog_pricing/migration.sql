-- CreateTable
CREATE TABLE "catalog_price_set" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "catalog_price_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_money_amount" (
    "id" UUID NOT NULL,
    "priceSetId" UUID NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "compareAt" INTEGER,
    "minQuantity" INTEGER,
    "maxQuantity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "catalog_money_amount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_price_set_variant" ON "catalog_price_set"("variantId");

-- CreateIndex
CREATE INDEX "idx_price_set_deleted_at" ON "catalog_price_set"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_money_amount_price_set" ON "catalog_money_amount"("priceSetId");

-- CreateIndex
CREATE INDEX "idx_money_amount_currency" ON "catalog_money_amount"("currencyCode");

-- CreateIndex
CREATE INDEX "idx_money_amount_deleted_at" ON "catalog_money_amount"("deletedAt");

-- AddForeignKey
ALTER TABLE "catalog_price_set" ADD CONSTRAINT "catalog_price_set_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_money_amount" ADD CONSTRAINT "catalog_money_amount_priceSetId_fkey" FOREIGN KEY ("priceSetId") REFERENCES "catalog_price_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_money_amount_currency_active"
ON "catalog_money_amount" ("priceSetId", "currencyCode")
WHERE "deletedAt" IS NULL AND "isActive" = true;
