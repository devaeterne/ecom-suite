-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('OPEN', 'PAYMENT_PENDING', 'PAYMENT_AUTHORIZED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELED', 'REFUNDED');

-- DropIndex
DROP INDEX "cart_status_updatedAt_idx";

-- CreateTable
CREATE TABLE "checkout" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "customerId" TEXT,
    "email" TEXT,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'OPEN',
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "regionId" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "shippingTotal" INTEGER NOT NULL DEFAULT 0,
    "taxTotal" INTEGER NOT NULL DEFAULT 0,
    "grandTotal" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "checkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_address" (
    "id" UUID NOT NULL,
    "checkoutId" UUID NOT NULL,
    "type" "AddressType" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "checkout_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "orderNo" TEXT NOT NULL,
    "checkoutId" UUID,
    "cartId" UUID,
    "customerId" TEXT,
    "email" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "regionId" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "shippingTotal" INTEGER NOT NULL DEFAULT 0,
    "taxTotal" INTEGER NOT NULL DEFAULT 0,
    "grandTotal" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line_item" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "compareAt" INTEGER,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "skuSnapshot" TEXT,
    "titleSnapshot" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payment" (
    "id" UUID NOT NULL,
    "orderId" UUID,
    "checkoutId" UUID,
    "provider" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "externalRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fulfillment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "carrier" TEXT,
    "trackingNo" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkout_cartId_key" ON "checkout"("cartId");

-- CreateIndex
CREATE INDEX "idx_checkout_status_updated" ON "checkout"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_checkout_customer" ON "checkout"("customerId");

-- CreateIndex
CREATE INDEX "idx_checkout_deleted_at" ON "checkout"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_checkout_address_checkout" ON "checkout_address"("checkoutId");

-- CreateIndex
CREATE INDEX "idx_checkout_address_deleted_at" ON "checkout_address"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_checkout_address_type" ON "checkout_address"("checkoutId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNo_key" ON "order"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "order_checkoutId_key" ON "order"("checkoutId");

-- CreateIndex
CREATE INDEX "idx_order_status_updated" ON "order"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_customer" ON "order"("customerId");

-- CreateIndex
CREATE INDEX "idx_order_created_at" ON "order"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_line_item_order" ON "order_line_item"("orderId");

-- CreateIndex
CREATE INDEX "idx_order_line_item_variant" ON "order_line_item"("variantId");

-- CreateIndex
CREATE INDEX "idx_order_payment_order" ON "order_payment"("orderId");

-- CreateIndex
CREATE INDEX "idx_order_payment_checkout" ON "order_payment"("checkoutId");

-- CreateIndex
CREATE INDEX "idx_order_payment_external_ref" ON "order_payment"("provider", "externalRef");

-- CreateIndex
CREATE INDEX "idx_order_fulfillment_order" ON "order_fulfillment"("orderId");

-- CreateIndex
CREATE INDEX "idx_order_history_order_created" ON "order_status_history"("orderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "cart_customerId_status_idx" ON "cart"("customerId", "status");

-- CreateIndex
CREATE INDEX "cart_status_updatedAt_idx" ON "cart"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "cart_expiresAt_idx" ON "cart"("expiresAt");


-- AddForeignKey
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_address" ADD CONSTRAINT "checkout_address_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_item" ADD CONSTRAINT "order_line_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_item" ADD CONSTRAINT "order_line_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
