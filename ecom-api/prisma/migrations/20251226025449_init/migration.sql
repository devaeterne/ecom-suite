-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('OPEN', 'PAYMENT_PENDING', 'PAYMENT_AUTHORIZED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CartAdjustmentType" AS ENUM ('DISCOUNT', 'SHIPPING', 'MANUAL');

-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('active', 'consumed', 'released');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "PriceListType" AS ENUM ('SALE', 'B2B', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('EMAIL_PASSWORD', 'GOOGLE', 'APPLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('ADMIN', 'STOREFRONT');

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

-- CreateTable
CREATE TABLE "product_media" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag" (
    "id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag_link" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "product_tag_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "parentId" UUID,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category_link" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "product_category_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collection" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collection_link" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,

    CONSTRAINT "product_collection_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_value" (
    "id" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_option_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option_value" (
    "id" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "optionValueId" UUID NOT NULL,

    CONSTRAINT "product_variant_option_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundle" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundle_item" (
    "id" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_bundle_item_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "price_list" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PriceListType" NOT NULL DEFAULT 'SALE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ(6),
    "endsAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rule" (
    "id" UUID NOT NULL,
    "priceListId" UUID NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "price_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rule_value" (
    "id" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "price_rule_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency" (
    "code" TEXT NOT NULL,
    "symbol" TEXT,
    "name" TEXT,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("code")
);

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
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMPTZ(6),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "consumedAt" TIMESTAMPTZ(6),
    "releasedAt" TIMESTAMPTZ(6),
    "consumedByType" TEXT,
    "consumedById" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "lineItemId" UUID,

    CONSTRAINT "inventory_reservation_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "cart_shipping_method" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_shipping_method_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "order_address" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
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

    CONSTRAINT "order_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_shipping_method" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "order_shipping_method_pkey" PRIMARY KEY ("id")
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
    "totalAmount" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_address" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
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

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_group" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_group_customer_link" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "customerId" UUID NOT NULL,

    CONSTRAINT "customer_group_customer_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "RoleScope" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission_link" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permission_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_link" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "user_role_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identity" (
    "id" UUID NOT NULL,
    "provider" "AuthProviderType" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID,
    "customerId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "idx_product_media_product_rank" ON "product_media"("productId", "rank");

-- CreateIndex
CREATE INDEX "idx_product_media_deleted_at" ON "product_media"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_value_key" ON "product_tag"("value");

-- CreateIndex
CREATE INDEX "idx_product_tag_link_tag" ON "product_tag_link"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_tag_link" ON "product_tag_link"("productId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_handle_key" ON "product_category"("handle");

-- CreateIndex
CREATE INDEX "idx_category_parent_rank" ON "product_category"("parentId", "rank");

-- CreateIndex
CREATE INDEX "idx_product_category_link_category" ON "product_category_link"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_category_link" ON "product_category_link"("productId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collection_handle_key" ON "product_collection"("handle");

-- CreateIndex
CREATE INDEX "idx_product_collection_link_collection" ON "product_collection_link"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_collection_link" ON "product_collection_link"("productId", "collectionId");

-- CreateIndex
CREATE INDEX "idx_product_option_product_rank" ON "product_option"("productId", "rank");

-- CreateIndex
CREATE INDEX "idx_product_option_value_option_rank" ON "product_option_value"("optionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_option_value" ON "product_option_value"("optionId", "value");

-- CreateIndex
CREATE INDEX "idx_variant_option_value_value" ON "product_variant_option_value"("optionValueId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_variant_option_value" ON "product_variant_option_value"("variantId", "optionValueId");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundle_handle_key" ON "product_bundle"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_bundle_variant" ON "product_bundle_item"("bundleId", "variantId");

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

-- CreateIndex
CREATE INDEX "idx_price_list_active_window" ON "price_list"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "idx_price_rule_list_attr" ON "price_rule"("priceListId", "attribute");

-- CreateIndex
CREATE INDEX "idx_price_rule_value_rule" ON "price_rule_value"("ruleId");

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

-- CreateIndex
CREATE INDEX "idx_inventory_res_consumed_at" ON "inventory_reservation"("consumedAt");

-- CreateIndex
CREATE INDEX "idx_inventory_res_released_at" ON "inventory_reservation"("releasedAt");

-- CreateIndex
CREATE INDEX "cart_customerId_status_idx" ON "cart"("customerId", "status");

-- CreateIndex
CREATE INDEX "cart_status_updatedAt_idx" ON "cart"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "cart_expiresAt_idx" ON "cart"("expiresAt");

-- CreateIndex
CREATE INDEX "cart_line_item_variantId_idx" ON "cart_line_item"("variantId");

-- CreateIndex
CREATE INDEX "cart_line_item_cartId_idx" ON "cart_line_item"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_line_item_cartId_variantId_key" ON "cart_line_item"("cartId", "variantId");

-- CreateIndex
CREATE INDEX "cart_adjustment_cartId_type_idx" ON "cart_adjustment"("cartId", "type");

-- CreateIndex
CREATE INDEX "cart_adjustment_code_idx" ON "cart_adjustment"("code");

-- CreateIndex
CREATE INDEX "idx_cart_shipping_cart" ON "cart_shipping_method"("cartId");

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
CREATE UNIQUE INDEX "uniq_order_address_type" ON "order_address"("orderId", "type");

-- CreateIndex
CREATE INDEX "idx_order_shipping_order" ON "order_shipping_method"("orderId");

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
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE INDEX "idx_customer_address_customer" ON "customer_address"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_group_name_key" ON "customer_group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_customer_group_customer" ON "customer_group_customer_link"("groupId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_role_permission" ON "role_permission_link"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_role" ON "user_role_link"("userId", "roleId");

-- CreateIndex
CREATE INDEX "idx_auth_identity_provider" ON "auth_identity"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "idx_session_expires" ON "session"("expiresAt");

-- AddForeignKey
ALTER TABLE "catalog_product_variant" ADD CONSTRAINT "catalog_product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_link" ADD CONSTRAINT "product_tag_link_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_link" ADD CONSTRAINT "product_tag_link_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "product_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_link" ADD CONSTRAINT "product_category_link_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_link" ADD CONSTRAINT "product_category_link_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_link" ADD CONSTRAINT "product_collection_link_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_link" ADD CONSTRAINT "product_collection_link_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "product_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option" ADD CONSTRAINT "product_option_productId_fkey" FOREIGN KEY ("productId") REFERENCES "catalog_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_value" ADD CONSTRAINT "product_option_value_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "product_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_value" ADD CONSTRAINT "product_variant_option_value_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_value" ADD CONSTRAINT "product_variant_option_value_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "product_option_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_item" ADD CONSTRAINT "product_bundle_item_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "product_bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_item" ADD CONSTRAINT "product_bundle_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_price_set" ADD CONSTRAINT "catalog_price_set_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_money_amount" ADD CONSTRAINT "catalog_money_amount_priceSetId_fkey" FOREIGN KEY ("priceSetId") REFERENCES "catalog_price_set"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule_value" ADD CONSTRAINT "price_rule_value_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "price_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "cart_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_adjustment" ADD CONSTRAINT "cart_adjustment_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_shipping_method" ADD CONSTRAINT "cart_shipping_method_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_address" ADD CONSTRAINT "checkout_address_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "checkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_address" ADD CONSTRAINT "order_address_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipping_method" ADD CONSTRAINT "order_shipping_method_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_group_customer_link" ADD CONSTRAINT "customer_group_customer_link_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "customer_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_group_customer_link" ADD CONSTRAINT "customer_group_customer_link_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission_link" ADD CONSTRAINT "role_permission_link_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission_link" ADD CONSTRAINT "role_permission_link_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "auth_identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
