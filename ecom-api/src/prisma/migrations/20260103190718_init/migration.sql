-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('OPEN', 'PAYMENT_PENDING', 'PAYMENT_AUTHORIZED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'CANCELED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CartAdjustmentType" AS ENUM ('DISCOUNT', 'SHIPPING', 'MANUAL');

-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "PriceListType" AS ENUM ('SALE', 'B2B', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('EMAIL_PASSWORD', 'GOOGLE', 'APPLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'PAYMENT_AUTH', 'PAYMENT_CAPTURE', 'PAYMENT_REFUND', 'SHIPMENT_CREATE', 'SHIPMENT_UPDATE');

-- CreateEnum
CREATE TYPE "FulfillmentProvider" AS ENUM ('MANUAL', 'ARAS', 'FEDEX', 'OTHER');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'CUSTOMER', 'SYSTEM', 'API_KEY');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'ALLOCATED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CREATED', 'LABEL_CREATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('STATUS_UPDATE', 'LOCATION_UPDATE', 'EXCEPTION', 'DELIVERY_ATTEMPT', 'INFO');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'VERIFONE', 'MANUAL', 'PAYTR');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentCollectionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ShippingProvider" AS ENUM ('SHIPPO', 'EASYPOST', 'MANUAL', 'VERIFONE');

-- CreateEnum
CREATE TYPE "ShippingProfileType" AS ENUM ('DEFAULT', 'GIFT_CARD', 'BULKY');

-- CreateEnum
CREATE TYPE "PickupPointType" AS ENUM ('PARTNER_POINT', 'STORE_LOCATION', 'LOCKER');

-- CreateEnum
CREATE TYPE "FileRole" AS ENUM ('PRIMARY', 'THUMBNAIL', 'GALLERY', 'BANNER', 'INVOICE', 'LABEL', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "DiscountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "DiscountMethod" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "AnalyticsChannel" AS ENUM ('STOREFRONT', 'ADMIN', 'API');

-- CreateEnum
CREATE TYPE "ProductEventType" AS ENUM ('VIEW', 'ADD_TO_CART', 'PURCHASE');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'REFUND_PENDING', 'REFUNDED', 'CANCELED', 'PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'SIZE_FIT', 'CHANGED_MIND', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('CUSTOMER_REQUEST', 'RETURN_RECEIVED', 'FRAUD', 'SHIPPING_ISSUE', 'PRICE_ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELED', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SALES', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceLineKind" AS ENUM ('ITEM', 'SHIPPING', 'DISCOUNT', 'TAX');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBSCRIPTION_TRIAL_ENDING', 'SUBSCRIPTION_RENEWAL_REMINDER', 'SUBSCRIPTION_PAST_DUE', 'SUBSCRIPTION_SUSPENDED', 'SUBSCRIPTION_REACTIVATED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('STRIPE', 'PAYTR', 'PAYPAL', 'VERIFONE', 'SHIPPO', 'EASYPOST', 'MANUAL');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "SubscriptionLifecycleEventType" AS ENUM ('TRIAL_STARTED', 'TRIAL_ENDING_SOON', 'TRIAL_ENDED', 'RENEWAL_REMINDER_7D', 'RENEWAL_REMINDER_3D', 'RENEWAL_REMINDER_1D', 'PERIOD_ENDED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'PAST_DUE_ENTERED', 'GRACE_STARTED', 'GRACE_ENDED', 'SUSPENDED', 'REACTIVATED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('VAT');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('PAYMENT', 'FULFILLMENT', 'NOTIFICATION', 'TAX');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('STRIPE', 'PAYPAL', 'VERIFONE', 'SHIPPO', 'EASYPOST', 'SMTP', 'SENDGRID', 'MAILGUN', 'MANUAL', 'PAYTR');

-- CreateEnum
CREATE TYPE "IntegrationEnv" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISABLED', 'ENABLED');

-- CreateEnum
CREATE TYPE "IntegrationRuleTarget" AS ENUM ('PAYMENT', 'FULFILLMENT', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "BankTransferType" AS ENUM ('TR_EFT', 'TR_HAVALE', 'SEPA', 'SWIFT');

-- CreateEnum
CREATE TYPE "BankTransferStatus" AS ENUM ('PENDING', 'SUBMITTED', 'RECEIVED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "tenant_bank_account" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "type" "BankTransferType" NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "iban" TEXT,
    "bic" TEXT,
    "accountNo" TEXT,
    "branchCode" TEXT,
    "bankCode" TEXT,
    "currencyCode" TEXT,
    "countryIso2" TEXT NOT NULL,
    "address" TEXT,
    "instructions" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenant_bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transfer_instruction" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID,
    "checkoutId" UUID,
    "bankAccountId" UUID,
    "snapshot" JSONB NOT NULL,
    "referenceCode" TEXT,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "status" "BankTransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "receiptFileId" UUID,

    CONSTRAINT "bank_transfer_instruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "env" "IntegrationEnv" NOT NULL DEFAULT 'PRODUCTION',
    "name" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISABLED',
    "config" JSONB NOT NULL DEFAULT '{}',
    "flags" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_secret" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "valueEnc" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rotatedAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "integration_secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_webhook_endpoint" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "urlPath" TEXT NOT NULL,
    "externalRef" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'ENABLED',
    "events" JSONB NOT NULL DEFAULT '[]',
    "secretKeyName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "integration_webhook_endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_rule" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "target" "IntegrationRuleTarget" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "integrationId" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "countryIso2" TEXT,
    "currencyCode" TEXT,
    "minAmount" INTEGER,
    "maxAmount" INTEGER,
    "paymentMethod" TEXT,
    "channelId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "integration_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_job_lock" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "lockedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "billing_job_lock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMPTZ(6),
    "requestId" TEXT,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "subscriptionId" UUID,
    "paymentId" UUID,
    "refundId" UUID,
    "orderId" UUID,
    "processedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_schedule" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "userId" UUID,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "sendAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "dedupeKey" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "templateCode" TEXT,
    "localeCode" TEXT,

    CONSTRAINT "email_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "scheduleId" UUID,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PROCESSING',
    "provider" TEXT,
    "externalRef" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "localeCode" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "orderPaymentId" UUID,
    "returnId" UUID,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "RefundReason",
    "note" TEXT,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "provider" TEXT,
    "externalRef" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "processedAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "paymentCollectionId" UUID,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_item" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "refundId" UUID NOT NULL,
    "orderLineItemId" UUID,
    "amount" INTEGER NOT NULL,
    "quantity" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "refund_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_series" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "prefix" TEXT,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "invoice_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'SALES',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "orderId" UUID,
    "refundId" UUID,
    "returnId" UUID,
    "seriesId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ(6),
    "dueAt" TIMESTAMPTZ(6),
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "shippingTotal" INTEGER NOT NULL DEFAULT 0,
    "taxTotal" INTEGER NOT NULL DEFAULT 0,
    "grandTotal" INTEGER NOT NULL DEFAULT 0,
    "sellerName" TEXT NOT NULL,
    "sellerAddress" JSONB NOT NULL,
    "sellerTaxId" TEXT,
    "sellerTaxOffice" TEXT,
    "sellerVatId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerAddress" JSONB NOT NULL,
    "buyerTaxId" TEXT,
    "buyerTaxOffice" TEXT,
    "buyerVatId" TEXT,
    "pdfFileId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "kind" "InvoiceLineKind" NOT NULL DEFAULT 'ITEM',
    "description" TEXT NOT NULL,
    "skuSnapshot" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "lineTotal" INTEGER NOT NULL DEFAULT 0,
    "vatRateBp" INTEGER,
    "vatAmount" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "invoice_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_request" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "customerId" UUID,
    "email" TEXT,
    "phone" TEXT,
    "reason" "ReturnReason",
    "note" TEXT,
    "receivedAt" TIMESTAMPTZ(6),
    "inspectedAt" TIMESTAMPTZ(6),
    "refundedAt" TIMESTAMPTZ(6),
    "labelFileId" UUID,
    "trackingNo" TEXT,
    "carrier" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "return_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_item" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "returnId" UUID NOT NULL,
    "orderLineItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "ReturnReason",
    "note" TEXT,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "approvedQuantity" INTEGER,
    "conditionNote" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "return_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_product" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMPTZ(6),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "searchKeywords" TEXT,
    "externalRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "catalog_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_product_variant" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "catalog_product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag_link" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "product_tag_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "product_category_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collection" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,

    CONSTRAINT "product_collection_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_value" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_option_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option_value" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "optionValueId" UUID NOT NULL,

    CONSTRAINT "product_variant_option_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundle" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "product_bundle_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_price_set" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PriceListType" NOT NULL DEFAULT 'SALE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ(6),
    "endsAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rule" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "priceListId" UUID NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "price_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rule_value" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "price_rule_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency" (
    "code" TEXT NOT NULL,
    "symbol" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "tenantId" UUID,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "inventory_location" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_level" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "stockedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "inventory_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "cartId" UUID,
    "checkoutId" UUID,
    "orderId" UUID,
    "idempotencyKey" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "cartLineItemId" UUID,

    CONSTRAINT "inventory_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "customerId" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "regionId" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_line_item" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "shippingOptionId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "cart_shipping_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_discount_application" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "codeSnapshot" TEXT,
    "methodSnapshot" "DiscountMethod" NOT NULL,
    "valueBpSnapshot" INTEGER,
    "valueSnapshot" INTEGER,
    "currencyCodeSnapshot" TEXT,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "cart_discount_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "checkoutId" UUID NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "fullName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "countryIso2" TEXT NOT NULL,
    "taxNo" TEXT,
    "taxOffice" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "checkout_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "fullName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "countryIso2" TEXT NOT NULL,
    "taxNo" TEXT,
    "taxOffice" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_shipping_method" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "shippingOptionId" UUID,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_shipping_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line_item" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "orderId" UUID,
    "checkoutId" UUID,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "externalRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "bankTransferInstructionId" UUID,

    CONSTRAINT "order_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fulfillment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "carrierId" UUID,
    "trackingNo" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_fulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_item" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderFulfillmentId" UUID NOT NULL,
    "orderLineItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "fulfillment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderFulfillmentId" UUID NOT NULL,
    "carrierId" UUID NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "labelUrl" TEXT,
    "providerShipmentId" TEXT,
    "shippedAt" TIMESTAMPTZ(6),
    "deliveredAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking_event" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "type" "TrackingEventType" NOT NULL,
    "status" "ShipmentStatus",
    "message" TEXT,
    "location" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_collection" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID,
    "status" "PaymentCollectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "payment_collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "externalRef" TEXT,
    "capturedAt" TIMESTAMPTZ(6),
    "canceledAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rate" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "countryIso2" TEXT NOT NULL,
    "regionCode" TEXT,
    "taxType" "TaxType" NOT NULL DEFAULT 'VAT',
    "name" TEXT NOT NULL,
    "rateBp" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "productType" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "effectiveFrom" TIMESTAMPTZ(6),
    "effectiveTo" TIMESTAMPTZ(6),

    CONSTRAINT "tax_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_payment_provider" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_payment_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_payment_profile" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "defaultCurrencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenant_payment_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
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
    "tenantId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "countryIso2" TEXT NOT NULL,
    "taxNo" TEXT,
    "taxOffice" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_group" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_group_customer_link" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "customerId" UUID NOT NULL,

    CONSTRAINT "customer_group_customer_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "RoleScope" NOT NULL DEFAULT 'STAFF',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "tenantId" UUID,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission_link" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "role_permission_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_link" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "user_role_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "typ" TEXT NOT NULL DEFAULT 'store',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identity" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "provider" "AuthProviderType" NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID,
    "customerId" UUID,
    "passwordHash" TEXT,
    "passwordAlgo" TEXT,
    "passwordUpdatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "typ" TEXT NOT NULL DEFAULT 'admin',
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "rotated_from_hash" TEXT,
    "lastUsedAt" TIMESTAMPTZ(6),
    "rotated_to_hash" TEXT,
    "reuse_detected_at" TIMESTAMPTZ(6),

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_carrier" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "provider" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "shipping_carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_location" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "PickupPointType" NOT NULL DEFAULT 'STORE_LOCATION',
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "shippingCarrierId" UUID,

    CONSTRAINT "pickup_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_profile" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShippingProfileType" NOT NULL DEFAULT 'DEFAULT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "shipping_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_option" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "ShippingProvider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "amount" INTEGER,
    "currencyCode" TEXT DEFAULT 'EUR',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "shipping_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "iso2" TEXT NOT NULL,
    "iso3" TEXT,
    "name" TEXT NOT NULL,
    "regionCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "country_pkey" PRIMARY KEY ("iso2")
);

-- CreateTable
CREATE TABLE "region" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_country" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "countryIso2" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "region_country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_rate" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "countryIso2" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rateBp" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "vat_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locale" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "locale_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "tenant_locale" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenant_locale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_product_translation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "handle" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "catalog_product_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category_translation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "product_category_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag_translation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "product_tag_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "actorUserId" UUID,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "actorLabel" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "entityLabel" TEXT,
    "requestId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_audit_log" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "actorIdentityId" UUID,
    "actorUserId" UUID,
    "actorCustomerId" UUID,
    "action" TEXT NOT NULL,
    "targetIdentityId" UUID,
    "targetUserId" UUID,
    "targetCustomerId" UUID,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_object" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'ecom',
    "key" TEXT NOT NULL,
    "url" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "checksum" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "filename" TEXT,
    "title" TEXT,
    "altText" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "file_object_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_link" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "role" "FileRole" NOT NULL DEFAULT 'GALLERY',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "file_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_lifecycle_event" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "eventType" "SubscriptionLifecycleEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "subscription_lifecycle_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL DEFAULT 'CODE',
    "status" "DiscountStatus" NOT NULL DEFAULT 'ACTIVE',
    "code" TEXT,
    "method" "DiscountMethod" NOT NULL DEFAULT 'PERCENT',
    "valueBp" INTEGER,
    "value" INTEGER,
    "currencyCode" TEXT,
    "startsAt" TIMESTAMPTZ(6),
    "endsAt" TIMESTAMPTZ(6),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "minSubtotal" INTEGER,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_rule" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "attribute" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "discount_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_rule_value" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "discount_rule_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_target" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "discount_target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_redemption" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "orderId" UUID,
    "checkoutId" UUID,
    "customerId" UUID,
    "redeemedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "discount_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_discount_application" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "codeSnapshot" TEXT,
    "methodSnapshot" "DiscountMethod" NOT NULL,
    "valueBpSnapshot" INTEGER,
    "valueSnapshot" INTEGER,
    "currencyCodeSnapshot" TEXT,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "order_discount_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slug" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "slug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirect" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "entityType" TEXT,
    "entityId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_meta" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "localeCode" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageFileId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "seo_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_event" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "localeCode" TEXT,
    "channel" "AnalyticsChannel" NOT NULL DEFAULT 'STOREFRONT',
    "customerId" UUID,
    "userId" UUID,
    "sessionId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "resultsCount" INTEGER,
    "clickedEntityType" TEXT,
    "clickedEntityId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "search_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_term_stat" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "term" TEXT NOT NULL,
    "normalizedTerm" TEXT NOT NULL,
    "localeCode" TEXT,
    "channel" "AnalyticsChannel" NOT NULL DEFAULT 'STOREFRONT',
    "searchesCount" INTEGER NOT NULL DEFAULT 0,
    "resultsCountSum" INTEGER NOT NULL DEFAULT 0,
    "zeroResultsCount" INTEGER NOT NULL DEFAULT 0,
    "lastSearchedAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "search_term_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_event" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "ProductEventType" NOT NULL,
    "channel" "AnalyticsChannel" NOT NULL DEFAULT 'STOREFRONT',
    "localeCode" TEXT,
    "productId" UUID,
    "variantId" UUID,
    "quantity" INTEGER,
    "amount" INTEGER,
    "currencyCode" TEXT,
    "customerId" UUID,
    "userId" UUID,
    "sessionId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "orderId" UUID,
    "cartId" UUID,
    "checkoutId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "product_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_daily_stat" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "channel" "AnalyticsChannel" NOT NULL DEFAULT 'STOREFRONT',
    "localeCode" TEXT,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "addToCartCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "quantitySum" INTEGER NOT NULL DEFAULT 0,
    "revenueSum" INTEGER NOT NULL DEFAULT 0,
    "lastEventAt" TIMESTAMPTZ(6),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "product_daily_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_daily_revenue" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "productDailyStatId" UUID NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "revenueSum" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "product_daily_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL,
    "priceAmount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscription" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "currentPeriodStart" TIMESTAMPTZ(6),
    "currentPeriodEnd" TIMESTAMPTZ(6),
    "trialEndsAt" TIMESTAMPTZ(6),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMPTZ(6),
    "provider" TEXT,
    "externalRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "graceEndsAt" TIMESTAMPTZ(6),
    "suspendedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenant_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "provider" TEXT,
    "externalRef" TEXT,
    "paidAt" TIMESTAMPTZ(6),
    "invoicePdfFileId" UUID,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "subscription_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_company" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "taxOffice" TEXT,
    "vatId" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "countryIso2" TEXT NOT NULL,
    "logoFileId" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tenant_company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tenant_bank_account_tenant" ON "tenant_bank_account"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tenant_bank_account_default" ON "tenant_bank_account"("tenantId", "isActive", "isDefault");

-- CreateIndex
CREATE INDEX "idx_tenant_bank_account_pick" ON "tenant_bank_account"("tenantId", "countryIso2", "currencyCode");

-- CreateIndex
CREATE INDEX "idx_tenant_bank_account_tenant_deleted_at" ON "tenant_bank_account"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_bank_account_tenantId_id_key" ON "tenant_bank_account"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_bank_transfer_instruction_tenant" ON "bank_transfer_instruction"("tenantId");

-- CreateIndex
CREATE INDEX "idx_bank_transfer_instruction_status_time" ON "bank_transfer_instruction"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_bank_transfer_instruction_tenant_deleted_at" ON "bank_transfer_instruction"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transfer_instruction_tenantId_id_key" ON "bank_transfer_instruction"("tenantId", "id");

-- CreateIndex
CREATE INDEX "integration_tenantId_idx" ON "integration"("tenantId");

-- CreateIndex
CREATE INDEX "idx_integration_tenant_status" ON "integration"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_integration_tenant_deleted_at" ON "integration"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_tenantId_id_key" ON "integration"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_integration_tenant_type_provider_env" ON "integration"("tenantId", "type", "provider", "env");

-- CreateIndex
CREATE INDEX "integration_secret_tenantId_idx" ON "integration_secret"("tenantId");

-- CreateIndex
CREATE INDEX "idx_integration_secret_integration" ON "integration_secret"("tenantId", "integrationId");

-- CreateIndex
CREATE INDEX "idx_integration_secret_tenant_deleted_at" ON "integration_secret"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_secret_tenantId_id_key" ON "integration_secret"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_integration_secret_active_key" ON "integration_secret"("tenantId", "integrationId", "key", "isActive");

-- CreateIndex
CREATE INDEX "integration_webhook_endpoint_tenantId_idx" ON "integration_webhook_endpoint"("tenantId");

-- CreateIndex
CREATE INDEX "idx_integration_webhook_status" ON "integration_webhook_endpoint"("tenantId", "integrationId", "status");

-- CreateIndex
CREATE INDEX "idx_integration_webhook_tenant_deleted_at" ON "integration_webhook_endpoint"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_webhook_endpoint_tenantId_id_key" ON "integration_webhook_endpoint"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_integration_webhook_path" ON "integration_webhook_endpoint"("tenantId", "integrationId", "urlPath");

-- CreateIndex
CREATE INDEX "integration_rule_tenantId_idx" ON "integration_rule"("tenantId");

-- CreateIndex
CREATE INDEX "idx_integration_rule_pick" ON "integration_rule"("tenantId", "target", "isActive", "priority");

-- CreateIndex
CREATE INDEX "idx_integration_rule_geo_currency" ON "integration_rule"("tenantId", "target", "countryIso2", "currencyCode");

-- CreateIndex
CREATE INDEX "idx_integration_rule_tenant_deleted_at" ON "integration_rule"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_rule_tenantId_id_key" ON "integration_rule"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_job_lock_key_key" ON "billing_job_lock"("key");

-- CreateIndex
CREATE INDEX "idx_billing_job_lock_expires_at" ON "billing_job_lock"("expiresAt");

-- CreateIndex
CREATE INDEX "webhook_event_tenantId_idx" ON "webhook_event"("tenantId");

-- CreateIndex
CREATE INDEX "idx_webhook_event_provider_status_time" ON "webhook_event"("tenantId", "provider", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_webhook_event_retry_queue" ON "webhook_event"("tenantId", "status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "idx_webhook_event_tenant_deleted_at" ON "webhook_event"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_tenantId_id_key" ON "webhook_event"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_webhook_event_provider_event_id" ON "webhook_event"("tenantId", "provider", "providerEventId");

-- CreateIndex
CREATE INDEX "email_schedule_tenantId_idx" ON "email_schedule"("tenantId");

-- CreateIndex
CREATE INDEX "idx_email_schedule_tenant_status_sendat" ON "email_schedule"("tenantId", "status", "sendAt");

-- CreateIndex
CREATE INDEX "idx_email_schedule_tenant_type_sendat" ON "email_schedule"("tenantId", "type", "sendAt");

-- CreateIndex
CREATE INDEX "idx_email_schedule_tenant_deleted_at" ON "email_schedule"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_schedule_tenantId_id_key" ON "email_schedule"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_email_schedule_tenant_dedupe" ON "email_schedule"("tenantId", "dedupeKey");

-- CreateIndex
CREATE INDEX "notification_log_tenantId_idx" ON "notification_log"("tenantId");

-- CreateIndex
CREATE INDEX "idx_notification_log_tenant_type_time" ON "notification_log"("tenantId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_notification_log_tenant_status_time" ON "notification_log"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_notification_log_tenant_deleted_at" ON "notification_log"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_log_tenantId_id_key" ON "notification_log"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_email_template_active" ON "email_template"("isActive");

-- CreateIndex
CREATE INDEX "idx_email_template_deleted_at" ON "email_template"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_email_template_code_locale" ON "email_template"("code", "localeCode");

-- CreateIndex
CREATE INDEX "refund_tenantId_idx" ON "refund"("tenantId");

-- CreateIndex
CREATE INDEX "idx_refund_tenant_order_time" ON "refund"("tenantId", "orderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_refund_tenant_status_time" ON "refund"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_refund_tenant_provider_ref" ON "refund"("tenantId", "provider", "externalRef");

-- CreateIndex
CREATE INDEX "idx_refund_tenant_deleted_at" ON "refund"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refund_tenantId_id_key" ON "refund"("tenantId", "id");

-- CreateIndex
CREATE INDEX "refund_item_tenantId_idx" ON "refund_item"("tenantId");

-- CreateIndex
CREATE INDEX "idx_refund_item_tenant_refund" ON "refund_item"("tenantId", "refundId");

-- CreateIndex
CREATE INDEX "idx_refund_item_tenant_line_item" ON "refund_item"("tenantId", "orderLineItemId");

-- CreateIndex
CREATE INDEX "idx_refund_item_tenant_deleted_at" ON "refund_item"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refund_item_tenantId_id_key" ON "refund_item"("tenantId", "id");

-- CreateIndex
CREATE INDEX "invoice_series_tenantId_idx" ON "invoice_series"("tenantId");

-- CreateIndex
CREATE INDEX "idx_invoice_series_tenant_active" ON "invoice_series"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "idx_invoice_series_tenant_deleted_at" ON "invoice_series"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_series_tenantId_id_key" ON "invoice_series"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_invoice_series_tenant_code" ON "invoice_series"("tenantId", "code");

-- CreateIndex
CREATE INDEX "invoice_tenantId_idx" ON "invoice"("tenantId");

-- CreateIndex
CREATE INDEX "idx_invoice_tenant_status_time" ON "invoice"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_invoice_tenant_order" ON "invoice"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "idx_invoice_tenant_deleted_at" ON "invoice"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_tenantId_id_key" ON "invoice"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_invoice_series_number" ON "invoice"("tenantId", "seriesId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_invoice_invoice_no" ON "invoice"("tenantId", "invoiceNo");

-- CreateIndex
CREATE INDEX "invoice_line_tenantId_idx" ON "invoice_line"("tenantId");

-- CreateIndex
CREATE INDEX "idx_invoice_line_tenant_invoice" ON "invoice_line"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "idx_invoice_line_tenant_deleted_at" ON "invoice_line"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_line_tenantId_id_key" ON "invoice_line"("tenantId", "id");

-- CreateIndex
CREATE INDEX "return_request_tenantId_idx" ON "return_request"("tenantId");

-- CreateIndex
CREATE INDEX "idx_return_request_tenant_order" ON "return_request"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "idx_return_request_tenant_status_time" ON "return_request"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_return_request_tenant_deleted_at" ON "return_request"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "return_request_tenantId_id_key" ON "return_request"("tenantId", "id");

-- CreateIndex
CREATE INDEX "return_item_tenantId_idx" ON "return_item"("tenantId");

-- CreateIndex
CREATE INDEX "idx_return_item_tenant_return" ON "return_item"("tenantId", "returnId");

-- CreateIndex
CREATE INDEX "idx_return_item_tenant_order_line" ON "return_item"("tenantId", "orderLineItemId");

-- CreateIndex
CREATE INDEX "idx_return_item_tenant_deleted_at" ON "return_item"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "return_item_tenantId_id_key" ON "return_item"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_return_item_line" ON "return_item"("tenantId", "returnId", "orderLineItemId");

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
CREATE INDEX "catalog_product_tenantId_idx" ON "catalog_product"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_product_tenantId_id_key" ON "catalog_product"("tenantId", "id");

-- CreateIndex
CREATE INDEX "catalog_product_variant_tenantId_idx" ON "catalog_product_variant"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_product_variant_tenantId_id_key" ON "catalog_product_variant"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_product_media_product_rank" ON "product_media"("tenantId", "productId", "rank");

-- CreateIndex
CREATE INDEX "idx_product_media_deleted_at" ON "product_media"("deletedAt");

-- CreateIndex
CREATE INDEX "product_media_tenantId_idx" ON "product_media"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_tenantId_id_key" ON "product_media"("tenantId", "id");

-- CreateIndex
CREATE INDEX "product_tag_tenantId_idx" ON "product_tag"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_tenantId_id_key" ON "product_tag"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_tenantId_value_key" ON "product_tag"("tenantId", "value");

-- CreateIndex
CREATE INDEX "idx_product_tag_link_tag" ON "product_tag_link"("tenantId", "tagId");

-- CreateIndex
CREATE INDEX "product_tag_link_tenantId_idx" ON "product_tag_link"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_link_tenantId_id_key" ON "product_tag_link"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_tag_link" ON "product_tag_link"("tenantId", "productId", "tagId");

-- CreateIndex
CREATE INDEX "idx_category_parent_rank" ON "product_category"("tenantId", "parentId", "rank");

-- CreateIndex
CREATE INDEX "product_category_tenantId_idx" ON "product_category"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_tenantId_id_key" ON "product_category"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_tenantId_handle_key" ON "product_category"("tenantId", "handle");

-- CreateIndex
CREATE INDEX "idx_product_category_link_category" ON "product_category_link"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "product_category_link_tenantId_idx" ON "product_category_link"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_link_tenantId_id_key" ON "product_category_link"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_category_link" ON "product_category_link"("tenantId", "productId", "categoryId");

-- CreateIndex
CREATE INDEX "product_collection_tenantId_idx" ON "product_collection"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collection_tenantId_id_key" ON "product_collection"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_collection_tenantId_handle_key" ON "product_collection"("tenantId", "handle");

-- CreateIndex
CREATE INDEX "idx_product_collection_link_collection" ON "product_collection_link"("tenantId", "collectionId");

-- CreateIndex
CREATE INDEX "product_collection_link_tenantId_idx" ON "product_collection_link"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collection_link_tenantId_id_key" ON "product_collection_link"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_collection_link" ON "product_collection_link"("tenantId", "productId", "collectionId");

-- CreateIndex
CREATE INDEX "idx_product_option_product_rank" ON "product_option"("tenantId", "productId", "rank");

-- CreateIndex
CREATE INDEX "product_option_tenantId_idx" ON "product_option"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_tenantId_id_key" ON "product_option"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_product_option_value_option_rank" ON "product_option_value"("tenantId", "optionId", "rank");

-- CreateIndex
CREATE INDEX "product_option_value_tenantId_idx" ON "product_option_value"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_value_tenantId_id_key" ON "product_option_value"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_option_value" ON "product_option_value"("tenantId", "optionId", "value");

-- CreateIndex
CREATE INDEX "idx_variant_option_value_value" ON "product_variant_option_value"("tenantId", "optionValueId");

-- CreateIndex
CREATE INDEX "product_variant_option_value_tenantId_idx" ON "product_variant_option_value"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_option_value_tenantId_id_key" ON "product_variant_option_value"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_variant_option_value" ON "product_variant_option_value"("tenantId", "variantId", "optionValueId");

-- CreateIndex
CREATE INDEX "product_bundle_tenantId_idx" ON "product_bundle"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundle_tenantId_id_key" ON "product_bundle"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundle_tenantId_handle_key" ON "product_bundle"("tenantId", "handle");

-- CreateIndex
CREATE INDEX "product_bundle_item_tenantId_idx" ON "product_bundle_item"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundle_item_tenantId_id_key" ON "product_bundle_item"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_bundle_variant" ON "product_bundle_item"("tenantId", "bundleId", "variantId");

-- CreateIndex
CREATE INDEX "catalog_price_set_tenantId_idx" ON "catalog_price_set"("tenantId");

-- CreateIndex
CREATE INDEX "idx_price_set_tenant_variant" ON "catalog_price_set"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "idx_price_set_deleted_at" ON "catalog_price_set"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_price_set_tenantId_id_key" ON "catalog_price_set"("tenantId", "id");

-- CreateIndex
CREATE INDEX "catalog_money_amount_tenantId_idx" ON "catalog_money_amount"("tenantId");

-- CreateIndex
CREATE INDEX "idx_money_amount_tenant_price_set" ON "catalog_money_amount"("tenantId", "priceSetId");

-- CreateIndex
CREATE INDEX "idx_money_amount_currency" ON "catalog_money_amount"("currencyCode");

-- CreateIndex
CREATE INDEX "idx_money_amount_deleted_at" ON "catalog_money_amount"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_money_amount_tenantId_id_key" ON "catalog_money_amount"("tenantId", "id");

-- CreateIndex
CREATE INDEX "price_list_tenantId_idx" ON "price_list"("tenantId");

-- CreateIndex
CREATE INDEX "idx_price_list_tenant_active_window" ON "price_list"("tenantId", "isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "idx_price_list_tenant_deleted_at" ON "price_list"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_tenantId_id_key" ON "price_list"("tenantId", "id");

-- CreateIndex
CREATE INDEX "price_rule_tenantId_idx" ON "price_rule"("tenantId");

-- CreateIndex
CREATE INDEX "idx_price_rule_tenant_list_attr" ON "price_rule"("tenantId", "priceListId", "attribute");

-- CreateIndex
CREATE INDEX "idx_price_rule_tenant_deleted_at" ON "price_rule"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "price_rule_tenantId_id_key" ON "price_rule"("tenantId", "id");

-- CreateIndex
CREATE INDEX "price_rule_value_tenantId_idx" ON "price_rule_value"("tenantId");

-- CreateIndex
CREATE INDEX "idx_price_rule_value_tenant_rule" ON "price_rule_value"("tenantId", "ruleId");

-- CreateIndex
CREATE INDEX "idx_price_rule_value_tenant_deleted_at" ON "price_rule_value"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "price_rule_value_tenantId_id_key" ON "price_rule_value"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_currency_deleted_at" ON "currency"("deletedAt");

-- CreateIndex
CREATE INDEX "inventory_location_tenantId_idx" ON "inventory_location"("tenantId");

-- CreateIndex
CREATE INDEX "idx_inventory_location_tenant_deleted_at" ON "inventory_location"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_location_tenantId_id_key" ON "inventory_location"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_location_tenantId_code_key" ON "inventory_location"("tenantId", "code");

-- CreateIndex
CREATE INDEX "inventory_level_tenantId_idx" ON "inventory_level"("tenantId");

-- CreateIndex
CREATE INDEX "idx_inventory_level_tenant_variant" ON "inventory_level"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "idx_inventory_level_tenant_location" ON "inventory_level"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "idx_inventory_level_tenant_deleted_at" ON "inventory_level"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_level_tenantId_id_key" ON "inventory_level"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_inventory_level_location_variant" ON "inventory_level"("tenantId", "locationId", "variantId");

-- CreateIndex
CREATE INDEX "inventory_reservation_tenantId_idx" ON "inventory_reservation"("tenantId");

-- CreateIndex
CREATE INDEX "idx_inventory_reservation_tenant_variant" ON "inventory_reservation"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "idx_inventory_reservation_tenant_location" ON "inventory_reservation"("tenantId", "locationId");

-- CreateIndex
CREATE INDEX "idx_inventory_reservation_tenant_status" ON "inventory_reservation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_inventory_reservation_tenant_expires_at" ON "inventory_reservation"("tenantId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_inventory_reservation_tenant_deleted_at" ON "inventory_reservation"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_reservation_tenantId_id_key" ON "inventory_reservation"("tenantId", "id");

-- CreateIndex
CREATE INDEX "cart_tenantId_idx" ON "cart"("tenantId");

-- CreateIndex
CREATE INDEX "idx_cart_tenant_deleted_at" ON "cart"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "idx_cart_tenant_customer_status" ON "cart"("tenantId", "customerId", "status");

-- CreateIndex
CREATE INDEX "idx_cart_tenant_status_updated" ON "cart"("tenantId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "idx_cart_tenant_expires_at" ON "cart"("tenantId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "cart_tenantId_id_key" ON "cart"("tenantId", "id");

-- CreateIndex
CREATE INDEX "cart_line_item_variantId_idx" ON "cart_line_item"("variantId");

-- CreateIndex
CREATE INDEX "cart_line_item_cartId_idx" ON "cart_line_item"("cartId");

-- CreateIndex
CREATE INDEX "cart_line_item_tenantId_idx" ON "cart_line_item"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_line_item_cartId_variantId_key" ON "cart_line_item"("cartId", "variantId");

-- CreateIndex
CREATE INDEX "cart_adjustment_cartId_type_idx" ON "cart_adjustment"("cartId", "type");

-- CreateIndex
CREATE INDEX "cart_adjustment_code_idx" ON "cart_adjustment"("code");

-- CreateIndex
CREATE INDEX "cart_adjustment_tenantId_idx" ON "cart_adjustment"("tenantId");

-- CreateIndex
CREATE INDEX "cart_shipping_method_tenantId_idx" ON "cart_shipping_method"("tenantId");

-- CreateIndex
CREATE INDEX "idx_cart_shipping_method_tenant_cart" ON "cart_shipping_method"("tenantId", "cartId");

-- CreateIndex
CREATE INDEX "idx_cart_shipping_method_tenant_deleted_at" ON "cart_shipping_method"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cart_shipping_method_tenantId_id_key" ON "cart_shipping_method"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_cart_shipping_method_cart_option" ON "cart_shipping_method"("tenantId", "cartId", "shippingOptionId");

-- CreateIndex
CREATE INDEX "cart_discount_application_tenantId_idx" ON "cart_discount_application"("tenantId");

-- CreateIndex
CREATE INDEX "idx_cart_discount_application_tenant_cart" ON "cart_discount_application"("tenantId", "cartId");

-- CreateIndex
CREATE INDEX "idx_cart_discount_application_tenant_discount" ON "cart_discount_application"("tenantId", "discountId");

-- CreateIndex
CREATE INDEX "idx_cart_discount_application_tenant_deleted_at" ON "cart_discount_application"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cart_discount_application_tenantId_id_key" ON "cart_discount_application"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_cart_discount_application" ON "cart_discount_application"("tenantId", "cartId", "discountId");

-- CreateIndex
CREATE INDEX "checkout_tenantId_idx" ON "checkout"("tenantId");

-- CreateIndex
CREATE INDEX "idx_checkout_tenant_deleted_at" ON "checkout"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "idx_checkout_tenant_status_updated" ON "checkout"("tenantId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_checkout_tenant_customer" ON "checkout"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_tenantId_id_key" ON "checkout"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_checkout_tenant_cart" ON "checkout"("tenantId", "cartId");

-- CreateIndex
CREATE INDEX "checkout_address_tenantId_idx" ON "checkout_address"("tenantId");

-- CreateIndex
CREATE INDEX "idx_checkout_address_tenant_checkout_type" ON "checkout_address"("tenantId", "checkoutId", "type");

-- CreateIndex
CREATE INDEX "idx_checkout_address_country" ON "checkout_address"("countryIso2");

-- CreateIndex
CREATE INDEX "idx_checkout_address_tenant_deleted_at" ON "checkout_address"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_address_tenantId_id_key" ON "checkout_address"("tenantId", "id");

-- CreateIndex
CREATE INDEX "order_tenantId_idx" ON "order"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_tenant_deleted_at" ON "order"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "idx_order_tenant_status_updated" ON "order"("tenantId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_tenant_customer" ON "order"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "idx_order_tenant_created_at" ON "order"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "order_tenantId_id_key" ON "order"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_order_tenant_order_no" ON "order"("tenantId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_order_tenant_checkout_id" ON "order"("tenantId", "checkoutId");

-- CreateIndex
CREATE INDEX "order_address_tenantId_idx" ON "order_address"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_address_tenant_order_type" ON "order_address"("tenantId", "orderId", "type");

-- CreateIndex
CREATE INDEX "idx_order_address_country" ON "order_address"("countryIso2");

-- CreateIndex
CREATE INDEX "idx_order_address_tenant_deleted_at" ON "order_address"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_address_tenantId_id_key" ON "order_address"("tenantId", "id");

-- CreateIndex
CREATE INDEX "order_shipping_method_tenantId_idx" ON "order_shipping_method"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_shipping_method_tenant_order" ON "order_shipping_method"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "idx_order_shipping_method_tenant_deleted_at" ON "order_shipping_method"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_shipping_method_tenantId_id_key" ON "order_shipping_method"("tenantId", "id");

-- CreateIndex
CREATE INDEX "order_line_item_tenantId_idx" ON "order_line_item"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_line_item_tenant_order" ON "order_line_item"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "idx_order_line_item_tenant_variant" ON "order_line_item"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "idx_order_line_item_tenant_deleted_at" ON "order_line_item"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_line_item_tenantId_id_key" ON "order_line_item"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_order_payment_tenant_external_ref" ON "order_payment"("tenantId", "externalRef");

-- CreateIndex
CREATE INDEX "order_payment_tenantId_idx" ON "order_payment"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_payment_tenant_provider" ON "order_payment"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "idx_order_payment_tenant_status" ON "order_payment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_order_payment_tenant_deleted_at" ON "order_payment"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_order_payment_tenant_provider_external_ref" ON "order_payment"("tenantId", "provider", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "order_payment_tenantId_id_key" ON "order_payment"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_order_fulfillment_order" ON "order_fulfillment"("orderId");

-- CreateIndex
CREATE INDEX "order_fulfillment_tenantId_idx" ON "order_fulfillment"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_fulfillment_tenant_order" ON "order_fulfillment"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "order_fulfillment_carrierId_idx" ON "order_fulfillment"("carrierId");

-- CreateIndex
CREATE INDEX "fulfillment_item_tenantId_idx" ON "fulfillment_item"("tenantId");

-- CreateIndex
CREATE INDEX "idx_fulfillment_item_fulfillment" ON "fulfillment_item"("orderFulfillmentId");

-- CreateIndex
CREATE INDEX "idx_fulfillment_item_line_item" ON "fulfillment_item"("orderLineItemId");

-- CreateIndex
CREATE INDEX "shipment_tenantId_idx" ON "shipment"("tenantId");

-- CreateIndex
CREATE INDEX "idx_shipment_fulfillment" ON "shipment"("orderFulfillmentId");

-- CreateIndex
CREATE INDEX "idx_shipment_carrier" ON "shipment"("carrierId");

-- CreateIndex
CREATE INDEX "idx_shipment_tenant_carrier" ON "shipment"("tenantId", "carrierId");

-- CreateIndex
CREATE INDEX "idx_shipment_tracking_number" ON "shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "idx_shipment_provider_id" ON "shipment"("providerShipmentId");

-- CreateIndex
CREATE INDEX "shipment_tracking_event_tenantId_idx" ON "shipment_tracking_event"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tracking_event_shipment_time" ON "shipment_tracking_event"("shipmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_order_history_order_created" ON "order_status_history"("orderId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "order_status_history_tenantId_idx" ON "order_status_history"("tenantId");

-- CreateIndex
CREATE INDEX "payment_collection_tenantId_idx" ON "payment_collection"("tenantId");

-- CreateIndex
CREATE INDEX "idx_payment_collection_tenant_status" ON "payment_collection"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_payment_collection_tenant_deleted_at" ON "payment_collection"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_collection_tenantId_id_key" ON "payment_collection"("tenantId", "id");

-- CreateIndex
CREATE INDEX "payment_tenantId_idx" ON "payment"("tenantId");

-- CreateIndex
CREATE INDEX "idx_payment_tenant_collection" ON "payment"("tenantId", "collectionId");

-- CreateIndex
CREATE INDEX "idx_payment_tenant_provider" ON "payment"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "idx_payment_tenant_status" ON "payment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_payment_tenant_external_ref" ON "payment"("tenantId", "externalRef");

-- CreateIndex
CREATE INDEX "idx_payment_tenant_deleted_at" ON "payment"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_tenantId_id_key" ON "payment"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_payment_tenant_provider_external_ref" ON "payment"("tenantId", "provider", "externalRef");

-- CreateIndex
CREATE INDEX "idx_tax_rate_country" ON "tax_rate"("countryIso2");

-- CreateIndex
CREATE INDEX "tax_rate_tenantId_idx" ON "tax_rate"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tax_rate_lookup" ON "tax_rate"("tenantId", "countryIso2", "regionCode", "taxType", "isActive");

-- CreateIndex
CREATE INDEX "idx_tax_rate_lookup_priority" ON "tax_rate"("tenantId", "countryIso2", "regionCode", "taxType", "isActive", "priority");

-- CreateIndex
CREATE INDEX "idx_tax_rate_tenant_deleted_at" ON "tax_rate"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rate_tenantId_id_key" ON "tax_rate"("tenantId", "id");

-- CreateIndex
CREATE INDEX "tenant_payment_provider_provider_idx" ON "tenant_payment_provider"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_provider_tenantId_provider_key" ON "tenant_payment_provider"("tenantId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_profile_tenantId_key" ON "tenant_payment_profile"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tenant_payment_profile_tenant_deleted_at" ON "tenant_payment_profile"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_profile_tenantId_id_key" ON "tenant_payment_profile"("tenantId", "id");

-- CreateIndex
CREATE INDEX "customer_tenantId_idx" ON "customer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tenantId_id_key" ON "customer"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_customer_tenant_email" ON "customer"("tenantId", "email");

-- CreateIndex
CREATE INDEX "customer_address_tenantId_idx" ON "customer_address"("tenantId");

-- CreateIndex
CREATE INDEX "idx_customer_address_tenant_customer" ON "customer_address"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "idx_customer_address_tenant_default" ON "customer_address"("tenantId", "isDefault");

-- CreateIndex
CREATE INDEX "idx_customer_address_country" ON "customer_address"("countryIso2");

-- CreateIndex
CREATE INDEX "idx_customer_address_tenant_deleted_at" ON "customer_address"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_address_tenantId_id_key" ON "customer_address"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_group_name_key" ON "customer_group"("name");

-- CreateIndex
CREATE INDEX "customer_group_tenantId_idx" ON "customer_group"("tenantId");

-- CreateIndex
CREATE INDEX "customer_group_customer_link_tenantId_idx" ON "customer_group_customer_link"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_customer_group_customer" ON "customer_group_customer_link"("groupId", "customerId");

-- CreateIndex
CREATE INDEX "idx_user_tenant_deleted_at" ON "user"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "user_tenantId_idx" ON "user"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenantId_id_key" ON "user"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_tenant_email" ON "user"("tenantId", "email");

-- CreateIndex
CREATE INDEX "role_tenantId_idx" ON "role"("tenantId");

-- CreateIndex
CREATE INDEX "idx_role_tenant_scope" ON "role"("tenantId", "scope");

-- CreateIndex
CREATE INDEX "idx_role_tenant_deleted_at" ON "role"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "role_tenantId_id_key" ON "role"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_role_tenant_name" ON "role"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE INDEX "idx_permission_deleted_at" ON "permission"("deletedAt");

-- CreateIndex
CREATE INDEX "role_permission_link_tenantId_idx" ON "role_permission_link"("tenantId");

-- CreateIndex
CREATE INDEX "idx_role_permission_permission" ON "role_permission_link"("permissionId");

-- CreateIndex
CREATE INDEX "idx_role_permission_tenant_deleted_at" ON "role_permission_link"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_link_tenantId_id_key" ON "role_permission_link"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_role_permission" ON "role_permission_link"("tenantId", "roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_role_link_tenantId_idx" ON "user_role_link"("tenantId");

-- CreateIndex
CREATE INDEX "idx_user_role_tenant_deleted_at" ON "user_role_link"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_link_tenantId_id_key" ON "user_role_link"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_user_role" ON "user_role_link"("tenantId", "userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_tokenHash_key" ON "password_reset_token"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_token_tenantId_idx" ON "password_reset_token"("tenantId");

-- CreateIndex
CREATE INDEX "password_reset_token_identityId_idx" ON "password_reset_token"("identityId");

-- CreateIndex
CREATE INDEX "password_reset_token_expiresAt_idx" ON "password_reset_token"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_auth_identity_provider" ON "auth_identity"("provider", "providerId");

-- CreateIndex
CREATE INDEX "auth_identity_tenantId_idx" ON "auth_identity"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_auth_identity_tenant_provider" ON "auth_identity"("tenantId", "provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_hash_key" ON "session"("token_hash");

-- CreateIndex
CREATE INDEX "idx_session_identity_revoked" ON "session"("identityId", "revokedAt");

-- CreateIndex
CREATE INDEX "idx_session_expires" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "session_tenantId_idx" ON "session"("tenantId");

-- CreateIndex
CREATE INDEX "session_identityId_idx" ON "session"("identityId");

-- CreateIndex
CREATE INDEX "session_familyId_idx" ON "session"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_code_key" ON "tenant"("code");

-- CreateIndex
CREATE INDEX "tenant_isActive_idx" ON "tenant"("isActive");

-- CreateIndex
CREATE INDEX "tenant_deletedAt_idx" ON "tenant"("deletedAt");

-- CreateIndex
CREATE INDEX "shipping_carrier_tenantId_idx" ON "shipping_carrier"("tenantId");

-- CreateIndex
CREATE INDEX "idx_shipping_carrier_tenant_deleted_at" ON "shipping_carrier"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_carrier_tenantId_id_key" ON "shipping_carrier"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_shipping_carrier_tenant_code" ON "shipping_carrier"("tenantId", "code");

-- CreateIndex
CREATE INDEX "pickup_location_tenantId_idx" ON "pickup_location"("tenantId");

-- CreateIndex
CREATE INDEX "idx_pickup_location_tenant_active" ON "pickup_location"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "idx_pickup_location_tenant_deleted_at" ON "pickup_location"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_location_tenantId_id_key" ON "pickup_location"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_pickup_location_tenant_code" ON "pickup_location"("tenantId", "code");

-- CreateIndex
CREATE INDEX "shipping_profile_tenantId_idx" ON "shipping_profile"("tenantId");

-- CreateIndex
CREATE INDEX "idx_shipping_profile_tenant_deleted_at" ON "shipping_profile"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_profile_tenantId_id_key" ON "shipping_profile"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_shipping_profile_tenant_name" ON "shipping_profile"("tenantId", "name");

-- CreateIndex
CREATE INDEX "shipping_option_tenantId_idx" ON "shipping_option"("tenantId");

-- CreateIndex
CREATE INDEX "idx_shipping_option_tenant_profile" ON "shipping_option"("tenantId", "profileId");

-- CreateIndex
CREATE INDEX "idx_shipping_option_tenant_provider" ON "shipping_option"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "idx_shipping_option_tenant_active" ON "shipping_option"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "idx_shipping_option_tenant_deleted_at" ON "shipping_option"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_option_tenantId_id_key" ON "shipping_option"("tenantId", "id");

-- CreateIndex
CREATE INDEX "idx_country_deleted_at" ON "country"("deletedAt");

-- CreateIndex
CREATE INDEX "region_tenantId_idx" ON "region"("tenantId");

-- CreateIndex
CREATE INDEX "idx_region_tenant_deleted_at" ON "region"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "region_tenantId_id_key" ON "region"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_region_tenant_code" ON "region"("tenantId", "code");

-- CreateIndex
CREATE INDEX "region_country_tenantId_idx" ON "region_country"("tenantId");

-- CreateIndex
CREATE INDEX "idx_region_country_country" ON "region_country"("countryIso2");

-- CreateIndex
CREATE INDEX "idx_region_country_tenant_deleted_at" ON "region_country"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "region_country_tenantId_id_key" ON "region_country"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_region_country" ON "region_country"("tenantId", "regionId", "countryIso2");

-- CreateIndex
CREATE INDEX "vat_rate_tenantId_idx" ON "vat_rate"("tenantId");

-- CreateIndex
CREATE INDEX "idx_vat_rate_tenant_region" ON "vat_rate"("tenantId", "regionId");

-- CreateIndex
CREATE INDEX "idx_vat_rate_country" ON "vat_rate"("countryIso2");

-- CreateIndex
CREATE INDEX "idx_vat_rate_tenant_active" ON "vat_rate"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "idx_vat_rate_tenant_deleted_at" ON "vat_rate"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "vat_rate_tenantId_id_key" ON "vat_rate"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_vat_rate_region_country_name" ON "vat_rate"("tenantId", "regionId", "countryIso2", "name");

-- CreateIndex
CREATE INDEX "idx_locale_deleted_at" ON "locale"("deletedAt");

-- CreateIndex
CREATE INDEX "tenant_locale_tenantId_idx" ON "tenant_locale"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tenant_locale_default" ON "tenant_locale"("tenantId", "isDefault");

-- CreateIndex
CREATE INDEX "idx_tenant_locale_tenant_deleted_at" ON "tenant_locale"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_locale_tenantId_id_key" ON "tenant_locale"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_tenant_locale" ON "tenant_locale"("tenantId", "localeCode");

-- CreateIndex
CREATE INDEX "catalog_product_translation_tenantId_idx" ON "catalog_product_translation"("tenantId");

-- CreateIndex
CREATE INDEX "idx_product_translation_tenant_deleted_at" ON "catalog_product_translation"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_product_translation_tenantId_id_key" ON "catalog_product_translation"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_translation_locale" ON "catalog_product_translation"("tenantId", "productId", "localeCode");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_locale_handle" ON "catalog_product_translation"("tenantId", "localeCode", "handle");

-- CreateIndex
CREATE INDEX "product_category_translation_tenantId_idx" ON "product_category_translation"("tenantId");

-- CreateIndex
CREATE INDEX "idx_category_translation_tenant_deleted_at" ON "product_category_translation"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_translation_tenantId_id_key" ON "product_category_translation"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_category_translation_locale" ON "product_category_translation"("tenantId", "categoryId", "localeCode");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_category_locale_handle" ON "product_category_translation"("tenantId", "localeCode", "handle");

-- CreateIndex
CREATE INDEX "product_tag_translation_tenantId_idx" ON "product_tag_translation"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tag_translation_tenant_deleted_at" ON "product_tag_translation"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_tag_translation_tenantId_id_key" ON "product_tag_translation"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_tag_translation_locale" ON "product_tag_translation"("tenantId", "tagId", "localeCode");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_tag_locale_handle" ON "product_tag_translation"("tenantId", "localeCode", "handle");

-- CreateIndex
CREATE INDEX "audit_log_tenantId_idx" ON "audit_log"("tenantId");

-- CreateIndex
CREATE INDEX "idx_audit_log_tenant_created_at" ON "audit_log"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_log_tenant_action_time" ON "audit_log"("tenantId", "action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_log_tenant_entity" ON "audit_log"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_audit_log_tenant_actor_time" ON "audit_log"("tenantId", "actorUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_log_tenant_deleted_at" ON "audit_log"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "audit_log_tenantId_id_key" ON "audit_log"("tenantId", "id");

-- CreateIndex
CREATE INDEX "auth_audit_log_tenantId_idx" ON "auth_audit_log"("tenantId");

-- CreateIndex
CREATE INDEX "auth_audit_log_action_idx" ON "auth_audit_log"("action");

-- CreateIndex
CREATE INDEX "auth_audit_log_createdAt_idx" ON "auth_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "file_object_tenantId_idx" ON "file_object"("tenantId");

-- CreateIndex
CREATE INDEX "idx_file_object_tenant_deleted_at" ON "file_object"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "idx_file_object_tenant_mime" ON "file_object"("tenantId", "mimeType");

-- CreateIndex
CREATE UNIQUE INDEX "file_object_tenantId_id_key" ON "file_object"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_file_object_bucket_key" ON "file_object"("tenantId", "bucket", "key");

-- CreateIndex
CREATE INDEX "file_link_tenantId_idx" ON "file_link"("tenantId");

-- CreateIndex
CREATE INDEX "idx_file_link_tenant_file" ON "file_link"("tenantId", "fileId");

-- CreateIndex
CREATE INDEX "idx_file_link_tenant_entity_sort" ON "file_link"("tenantId", "entityType", "entityId", "sort");

-- CreateIndex
CREATE INDEX "idx_file_link_tenant_deleted_at" ON "file_link"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "file_link_tenantId_id_key" ON "file_link"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_file_link_entity_file_role" ON "file_link"("tenantId", "entityType", "entityId", "fileId", "role");

-- CreateIndex
CREATE INDEX "subscription_lifecycle_event_tenantId_idx" ON "subscription_lifecycle_event"("tenantId");

-- CreateIndex
CREATE INDEX "idx_sub_lifecycle_event_sub_time" ON "subscription_lifecycle_event"("tenantId", "subscriptionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_sub_lifecycle_event_type_time" ON "subscription_lifecycle_event"("tenantId", "eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_sub_lifecycle_event_deleted_at" ON "subscription_lifecycle_event"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_lifecycle_event_tenantId_id_key" ON "subscription_lifecycle_event"("tenantId", "id");

-- CreateIndex
CREATE INDEX "discount_tenantId_idx" ON "discount"("tenantId");

-- CreateIndex
CREATE INDEX "idx_discount_tenant_status" ON "discount"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_discount_tenant_type" ON "discount"("tenantId", "type");

-- CreateIndex
CREATE INDEX "idx_discount_tenant_window" ON "discount"("tenantId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "idx_discount_tenant_deleted_at" ON "discount"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_tenantId_id_key" ON "discount"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_discount_tenant_code" ON "discount"("tenantId", "code");

-- CreateIndex
CREATE INDEX "discount_rule_tenantId_idx" ON "discount_rule"("tenantId");

-- CreateIndex
CREATE INDEX "idx_discount_rule_tenant_discount" ON "discount_rule"("tenantId", "discountId");

-- CreateIndex
CREATE INDEX "idx_discount_rule_tenant_attr" ON "discount_rule"("tenantId", "attribute");

-- CreateIndex
CREATE INDEX "idx_discount_rule_tenant_deleted_at" ON "discount_rule"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_rule_tenantId_id_key" ON "discount_rule"("tenantId", "id");

-- CreateIndex
CREATE INDEX "discount_rule_value_tenantId_idx" ON "discount_rule_value"("tenantId");

-- CreateIndex
CREATE INDEX "idx_discount_rule_value_tenant_rule" ON "discount_rule_value"("tenantId", "ruleId");

-- CreateIndex
CREATE INDEX "idx_discount_rule_value_tenant_deleted_at" ON "discount_rule_value"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_rule_value_tenantId_id_key" ON "discount_rule_value"("tenantId", "id");

-- CreateIndex
CREATE INDEX "discount_target_tenantId_idx" ON "discount_target"("tenantId");

-- CreateIndex
CREATE INDEX "idx_discount_target_tenant_discount" ON "discount_target"("tenantId", "discountId");

-- CreateIndex
CREATE INDEX "idx_discount_target_tenant_target" ON "discount_target"("tenantId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "idx_discount_target_tenant_deleted_at" ON "discount_target"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_target_tenantId_id_key" ON "discount_target"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_discount_target" ON "discount_target"("tenantId", "discountId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "discount_redemption_tenantId_idx" ON "discount_redemption"("tenantId");

-- CreateIndex
CREATE INDEX "idx_discount_redemption_tenant_discount" ON "discount_redemption"("tenantId", "discountId");

-- CreateIndex
CREATE INDEX "idx_discount_redemption_tenant_customer_time" ON "discount_redemption"("tenantId", "customerId", "redeemedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_discount_redemption_tenant_deleted_at" ON "discount_redemption"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_redemption_tenantId_id_key" ON "discount_redemption"("tenantId", "id");

-- CreateIndex
CREATE INDEX "order_discount_application_tenantId_idx" ON "order_discount_application"("tenantId");

-- CreateIndex
CREATE INDEX "idx_order_discount_application_tenant_order" ON "order_discount_application"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "idx_order_discount_application_tenant_discount" ON "order_discount_application"("tenantId", "discountId");

-- CreateIndex
CREATE INDEX "idx_order_discount_application_tenant_deleted_at" ON "order_discount_application"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_discount_application_tenantId_id_key" ON "order_discount_application"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_order_discount_application" ON "order_discount_application"("tenantId", "orderId", "discountId");

-- CreateIndex
CREATE INDEX "slug_tenantId_idx" ON "slug"("tenantId");

-- CreateIndex
CREATE INDEX "idx_slug_entity_locale" ON "slug"("tenantId", "entityType", "entityId", "localeCode");

-- CreateIndex
CREATE INDEX "idx_slug_tenant_deleted_at" ON "slug"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "slug_tenantId_id_key" ON "slug"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_slug_tenant_locale_slug" ON "slug"("tenantId", "localeCode", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_slug_entity_locale_slug" ON "slug"("tenantId", "entityType", "entityId", "localeCode", "slug");

-- CreateIndex
CREATE INDEX "redirect_tenantId_idx" ON "redirect"("tenantId");

-- CreateIndex
CREATE INDEX "idx_redirect_locale_active" ON "redirect"("tenantId", "localeCode", "isActive");

-- CreateIndex
CREATE INDEX "idx_redirect_entity" ON "redirect"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_redirect_tenant_deleted_at" ON "redirect"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "redirect_tenantId_id_key" ON "redirect"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_redirect_from" ON "redirect"("tenantId", "localeCode", "from");

-- CreateIndex
CREATE INDEX "seo_meta_tenantId_idx" ON "seo_meta"("tenantId");

-- CreateIndex
CREATE INDEX "idx_seo_meta_tenant_deleted_at" ON "seo_meta"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "seo_meta_tenantId_id_key" ON "seo_meta"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_seo_meta_entity_locale" ON "seo_meta"("tenantId", "entityType", "entityId", "localeCode");

-- CreateIndex
CREATE INDEX "search_event_tenantId_idx" ON "search_event"("tenantId");

-- CreateIndex
CREATE INDEX "idx_search_event_tenant_time" ON "search_event"("tenantId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_search_event_tenant_query_time" ON "search_event"("tenantId", "normalizedQuery", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_search_event_tenant_channel_time" ON "search_event"("tenantId", "channel", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_search_event_tenant_deleted_at" ON "search_event"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_event_tenantId_id_key" ON "search_event"("tenantId", "id");

-- CreateIndex
CREATE INDEX "search_term_stat_tenantId_idx" ON "search_term_stat"("tenantId");

-- CreateIndex
CREATE INDEX "idx_search_term_stat_tenant_day" ON "search_term_stat"("tenantId", "day");

-- CreateIndex
CREATE INDEX "idx_search_term_stat_tenant_day_count" ON "search_term_stat"("tenantId", "day", "searchesCount" DESC);

-- CreateIndex
CREATE INDEX "idx_search_term_stat_tenant_term" ON "search_term_stat"("tenantId", "normalizedTerm");

-- CreateIndex
CREATE INDEX "idx_search_term_stat_tenant_deleted_at" ON "search_term_stat"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_search_term_stat_day_term_locale_channel" ON "search_term_stat"("tenantId", "day", "normalizedTerm", "localeCode", "channel");

-- CreateIndex
CREATE INDEX "product_event_tenantId_idx" ON "product_event"("tenantId");

-- CreateIndex
CREATE INDEX "idx_product_event_tenant_time" ON "product_event"("tenantId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_event_tenant_type_time" ON "product_event"("tenantId", "eventType", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_event_tenant_product_time" ON "product_event"("tenantId", "productId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_event_tenant_variant_time" ON "product_event"("tenantId", "variantId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_event_tenant_deleted_at" ON "product_event"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_event_tenantId_id_key" ON "product_event"("tenantId", "id");

-- CreateIndex
CREATE INDEX "product_daily_stat_tenantId_idx" ON "product_daily_stat"("tenantId");

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_day" ON "product_daily_stat"("tenantId", "day");

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_day_views" ON "product_daily_stat"("tenantId", "day", "viewCount" DESC);

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_day_atc" ON "product_daily_stat"("tenantId", "day", "addToCartCount" DESC);

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_day_purchase" ON "product_daily_stat"("tenantId", "day", "purchaseCount" DESC);

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_day_revenue" ON "product_daily_stat"("tenantId", "day", "revenueSum" DESC);

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_product" ON "product_daily_stat"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "idx_product_daily_stat_tenant_deleted_at" ON "product_daily_stat"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_daily_stat_tenantId_id_key" ON "product_daily_stat"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_daily_stat_key" ON "product_daily_stat"("tenantId", "day", "channel", "localeCode", "productId", "variantId");

-- CreateIndex
CREATE INDEX "product_daily_revenue_tenantId_idx" ON "product_daily_revenue"("tenantId");

-- CreateIndex
CREATE INDEX "idx_product_daily_revenue_tenant_day" ON "product_daily_revenue"("tenantId", "day");

-- CreateIndex
CREATE INDEX "idx_product_daily_revenue_tenant_currency" ON "product_daily_revenue"("tenantId", "currencyCode");

-- CreateIndex
CREATE INDEX "idx_product_daily_revenue_tenant_deleted_at" ON "product_daily_revenue"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_product_daily_revenue_key" ON "product_daily_revenue"("tenantId", "day", "productDailyStatId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_code_key" ON "subscription_plan"("code");

-- CreateIndex
CREATE INDEX "idx_subscription_plan_active" ON "subscription_plan"("isActive");

-- CreateIndex
CREATE INDEX "idx_subscription_plan_deleted_at" ON "subscription_plan"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_tenant_subscription_tenant" ON "tenant_subscription"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tenant_subscription_status_period_end" ON "tenant_subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "idx_tenant_subscription_deleted_at" ON "tenant_subscription"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_tenant_subscription_tenant_status_period_end" ON "tenant_subscription"("tenantId", "status", "currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscription_tenantId_id_key" ON "tenant_subscription"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_tenant_subscription_versioning" ON "tenant_subscription"("tenantId", "planId", "status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "idx_subscription_payment_tenant" ON "subscription_payment"("tenantId");

-- CreateIndex
CREATE INDEX "idx_subscription_payment_sub_time" ON "subscription_payment"("tenantId", "subscriptionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_subscription_payment_provider_ref" ON "subscription_payment"("tenantId", "provider", "externalRef");

-- CreateIndex
CREATE INDEX "idx_subscription_payment_status" ON "subscription_payment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "idx_subscription_payment_deleted_at" ON "subscription_payment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payment_tenantId_id_key" ON "subscription_payment"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_company_tenantId_key" ON "tenant_company"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_company_tenantId_idx" ON "tenant_company"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tenant_company_country" ON "tenant_company"("countryIso2");

-- CreateIndex
CREATE INDEX "idx_tenant_company_tenant_deleted_at" ON "tenant_company"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_company_tenantId_id_key" ON "tenant_company"("tenantId", "id");

-- AddForeignKey
ALTER TABLE "tenant_bank_account" ADD CONSTRAINT "tenant_bank_account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_bank_account" ADD CONSTRAINT "tenant_bank_account_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfer_instruction" ADD CONSTRAINT "bank_transfer_instruction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfer_instruction" ADD CONSTRAINT "bank_transfer_instruction_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfer_instruction" ADD CONSTRAINT "bank_transfer_instruction_tenantId_checkoutId_fkey" FOREIGN KEY ("tenantId", "checkoutId") REFERENCES "checkout"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfer_instruction" ADD CONSTRAINT "bank_transfer_instruction_tenantId_receiptFileId_fkey" FOREIGN KEY ("tenantId", "receiptFileId") REFERENCES "file_object"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_secret" ADD CONSTRAINT "integration_secret_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_secret" ADD CONSTRAINT "integration_secret_tenantId_integrationId_fkey" FOREIGN KEY ("tenantId", "integrationId") REFERENCES "integration"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_webhook_endpoint" ADD CONSTRAINT "integration_webhook_endpoint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_webhook_endpoint" ADD CONSTRAINT "integration_webhook_endpoint_tenantId_integrationId_fkey" FOREIGN KEY ("tenantId", "integrationId") REFERENCES "integration"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_rule" ADD CONSTRAINT "integration_rule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_rule" ADD CONSTRAINT "integration_rule_tenantId_integrationId_fkey" FOREIGN KEY ("tenantId", "integrationId") REFERENCES "integration"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_tenantId_subscriptionId_fkey" FOREIGN KEY ("tenantId", "subscriptionId") REFERENCES "tenant_subscription"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_tenantId_paymentId_fkey" FOREIGN KEY ("tenantId", "paymentId") REFERENCES "subscription_payment"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_tenantId_refundId_fkey" FOREIGN KEY ("tenantId", "refundId") REFERENCES "refund"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_schedule" ADD CONSTRAINT "email_schedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_schedule" ADD CONSTRAINT "email_schedule_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "user"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_tenantId_scheduleId_fkey" FOREIGN KEY ("tenantId", "scheduleId") REFERENCES "email_schedule"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_tenantId_orderPaymentId_fkey" FOREIGN KEY ("tenantId", "orderPaymentId") REFERENCES "order_payment"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_tenantId_returnId_fkey" FOREIGN KEY ("tenantId", "returnId") REFERENCES "return_request"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_paymentCollectionId_fkey" FOREIGN KEY ("paymentCollectionId") REFERENCES "payment_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_item" ADD CONSTRAINT "refund_item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_item" ADD CONSTRAINT "refund_item_tenantId_refundId_fkey" FOREIGN KEY ("tenantId", "refundId") REFERENCES "refund"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_item" ADD CONSTRAINT "refund_item_tenantId_orderLineItemId_fkey" FOREIGN KEY ("tenantId", "orderLineItemId") REFERENCES "order_line_item"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_series" ADD CONSTRAINT "invoice_series_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_seriesId_fkey" FOREIGN KEY ("tenantId", "seriesId") REFERENCES "invoice_series"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_refundId_fkey" FOREIGN KEY ("tenantId", "refundId") REFERENCES "refund"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_returnId_fkey" FOREIGN KEY ("tenantId", "returnId") REFERENCES "return_request"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenantId_pdfFileId_fkey" FOREIGN KEY ("tenantId", "pdfFileId") REFERENCES "file_object"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_tenantId_invoiceId_fkey" FOREIGN KEY ("tenantId", "invoiceId") REFERENCES "invoice"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_request" ADD CONSTRAINT "return_request_tenantId_labelFileId_fkey" FOREIGN KEY ("tenantId", "labelFileId") REFERENCES "file_object"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_tenantId_returnId_fkey" FOREIGN KEY ("tenantId", "returnId") REFERENCES "return_request"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_tenantId_orderLineItemId_fkey" FOREIGN KEY ("tenantId", "orderLineItemId") REFERENCES "order_line_item"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product" ADD CONSTRAINT "catalog_product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_variant" ADD CONSTRAINT "catalog_product_variant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_variant" ADD CONSTRAINT "catalog_product_variant_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_link" ADD CONSTRAINT "product_tag_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_link" ADD CONSTRAINT "product_tag_link_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_link" ADD CONSTRAINT "product_tag_link_tenantId_tagId_fkey" FOREIGN KEY ("tenantId", "tagId") REFERENCES "product_tag"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_tenantId_parentId_fkey" FOREIGN KEY ("tenantId", "parentId") REFERENCES "product_category"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_link" ADD CONSTRAINT "product_category_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_link" ADD CONSTRAINT "product_category_link_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_link" ADD CONSTRAINT "product_category_link_tenantId_categoryId_fkey" FOREIGN KEY ("tenantId", "categoryId") REFERENCES "product_category"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_link" ADD CONSTRAINT "product_collection_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_link" ADD CONSTRAINT "product_collection_link_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_link" ADD CONSTRAINT "product_collection_link_tenantId_collectionId_fkey" FOREIGN KEY ("tenantId", "collectionId") REFERENCES "product_collection"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option" ADD CONSTRAINT "product_option_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option" ADD CONSTRAINT "product_option_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_value" ADD CONSTRAINT "product_option_value_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_value" ADD CONSTRAINT "product_option_value_tenantId_optionId_fkey" FOREIGN KEY ("tenantId", "optionId") REFERENCES "product_option"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_value" ADD CONSTRAINT "product_variant_option_value_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_value" ADD CONSTRAINT "product_variant_option_value_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "catalog_product_variant"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option_value" ADD CONSTRAINT "product_variant_option_value_tenantId_optionValueId_fkey" FOREIGN KEY ("tenantId", "optionValueId") REFERENCES "product_option_value"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle" ADD CONSTRAINT "product_bundle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_item" ADD CONSTRAINT "product_bundle_item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_item" ADD CONSTRAINT "product_bundle_item_tenantId_bundleId_fkey" FOREIGN KEY ("tenantId", "bundleId") REFERENCES "product_bundle"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_item" ADD CONSTRAINT "product_bundle_item_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "catalog_product_variant"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_price_set" ADD CONSTRAINT "catalog_price_set_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_price_set" ADD CONSTRAINT "catalog_price_set_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "catalog_product_variant"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_money_amount" ADD CONSTRAINT "catalog_money_amount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_money_amount" ADD CONSTRAINT "catalog_money_amount_tenantId_priceSetId_fkey" FOREIGN KEY ("tenantId", "priceSetId") REFERENCES "catalog_price_set"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule" ADD CONSTRAINT "price_rule_tenantId_priceListId_fkey" FOREIGN KEY ("tenantId", "priceListId") REFERENCES "price_list"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule_value" ADD CONSTRAINT "price_rule_value_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rule_value" ADD CONSTRAINT "price_rule_value_tenantId_ruleId_fkey" FOREIGN KEY ("tenantId", "ruleId") REFERENCES "price_rule"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency" ADD CONSTRAINT "currency_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_location" ADD CONSTRAINT "inventory_location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_tenantId_locationId_fkey" FOREIGN KEY ("tenantId", "locationId") REFERENCES "inventory_location"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_level" ADD CONSTRAINT "inventory_level_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "catalog_product_variant"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_tenantId_locationId_fkey" FOREIGN KEY ("tenantId", "locationId") REFERENCES "inventory_location"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "catalog_product_variant"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_tenantId_cartId_fkey" FOREIGN KEY ("tenantId", "cartId") REFERENCES "cart"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_tenantId_checkoutId_fkey" FOREIGN KEY ("tenantId", "checkoutId") REFERENCES "checkout"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_cartLineItemId_fkey" FOREIGN KEY ("cartLineItemId") REFERENCES "cart_line_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_line_item" ADD CONSTRAINT "cart_line_item_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "catalog_product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_adjustment" ADD CONSTRAINT "cart_adjustment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_adjustment" ADD CONSTRAINT "cart_adjustment_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_shipping_method" ADD CONSTRAINT "cart_shipping_method_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_shipping_method" ADD CONSTRAINT "cart_shipping_method_tenantId_cartId_fkey" FOREIGN KEY ("tenantId", "cartId") REFERENCES "cart"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_shipping_method" ADD CONSTRAINT "cart_shipping_method_tenantId_shippingOptionId_fkey" FOREIGN KEY ("tenantId", "shippingOptionId") REFERENCES "shipping_option"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_discount_application" ADD CONSTRAINT "cart_discount_application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_discount_application" ADD CONSTRAINT "cart_discount_application_tenantId_cartId_fkey" FOREIGN KEY ("tenantId", "cartId") REFERENCES "cart"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_discount_application" ADD CONSTRAINT "cart_discount_application_tenantId_discountId_fkey" FOREIGN KEY ("tenantId", "discountId") REFERENCES "discount"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_tenantId_cartId_fkey" FOREIGN KEY ("tenantId", "cartId") REFERENCES "cart"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_address" ADD CONSTRAINT "checkout_address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_address" ADD CONSTRAINT "checkout_address_tenantId_checkoutId_fkey" FOREIGN KEY ("tenantId", "checkoutId") REFERENCES "checkout"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_address" ADD CONSTRAINT "checkout_address_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_address" ADD CONSTRAINT "order_address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_address" ADD CONSTRAINT "order_address_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_address" ADD CONSTRAINT "order_address_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipping_method" ADD CONSTRAINT "order_shipping_method_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipping_method" ADD CONSTRAINT "order_shipping_method_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipping_method" ADD CONSTRAINT "order_shipping_method_tenantId_shippingOptionId_fkey" FOREIGN KEY ("tenantId", "shippingOptionId") REFERENCES "shipping_option"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_item" ADD CONSTRAINT "order_line_item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_item" ADD CONSTRAINT "order_line_item_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_item" ADD CONSTRAINT "order_line_item_tenantId_variantId_fkey" FOREIGN KEY ("tenantId", "variantId") REFERENCES "catalog_product_variant"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_tenantId_checkoutId_fkey" FOREIGN KEY ("tenantId", "checkoutId") REFERENCES "checkout"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment" ADD CONSTRAINT "order_payment_tenantId_bankTransferInstructionId_fkey" FOREIGN KEY ("tenantId", "bankTransferInstructionId") REFERENCES "bank_transfer_instruction"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillment" ADD CONSTRAINT "order_fulfillment_tenantId_carrierId_fkey" FOREIGN KEY ("tenantId", "carrierId") REFERENCES "shipping_carrier"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_orderFulfillmentId_fkey" FOREIGN KEY ("orderFulfillmentId") REFERENCES "order_fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_item" ADD CONSTRAINT "fulfillment_item_orderLineItemId_fkey" FOREIGN KEY ("orderLineItemId") REFERENCES "order_line_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_orderFulfillmentId_fkey" FOREIGN KEY ("orderFulfillmentId") REFERENCES "order_fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "shipping_carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_event" ADD CONSTRAINT "shipment_tracking_event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_event" ADD CONSTRAINT "shipment_tracking_event_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_collection" ADD CONSTRAINT "payment_collection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_collection" ADD CONSTRAINT "payment_collection_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenantId_collectionId_fkey" FOREIGN KEY ("tenantId", "collectionId") REFERENCES "payment_collection"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rate" ADD CONSTRAINT "tax_rate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rate" ADD CONSTRAINT "tax_rate_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_payment_provider" ADD CONSTRAINT "tenant_payment_provider_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_payment_profile" ADD CONSTRAINT "tenant_payment_profile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_tenantId_customerId_fkey" FOREIGN KEY ("tenantId", "customerId") REFERENCES "customer"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_group" ADD CONSTRAINT "customer_group_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_group_customer_link" ADD CONSTRAINT "customer_group_customer_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_group_customer_link" ADD CONSTRAINT "customer_group_customer_link_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "customer_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_group_customer_link" ADD CONSTRAINT "customer_group_customer_link_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission_link" ADD CONSTRAINT "role_permission_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission_link" ADD CONSTRAINT "role_permission_link_tenantId_roleId_fkey" FOREIGN KEY ("tenantId", "roleId") REFERENCES "role"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission_link" ADD CONSTRAINT "role_permission_link_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_tenantId_userId_fkey" FOREIGN KEY ("tenantId", "userId") REFERENCES "user"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_link" ADD CONSTRAINT "user_role_link_tenantId_roleId_fkey" FOREIGN KEY ("tenantId", "roleId") REFERENCES "role"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "auth_identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "auth_identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_carrier" ADD CONSTRAINT "shipping_carrier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_location" ADD CONSTRAINT "pickup_location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_location" ADD CONSTRAINT "pickup_location_shippingCarrierId_fkey" FOREIGN KEY ("shippingCarrierId") REFERENCES "shipping_carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_profile" ADD CONSTRAINT "shipping_profile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_option" ADD CONSTRAINT "shipping_option_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_option" ADD CONSTRAINT "shipping_option_tenantId_profileId_fkey" FOREIGN KEY ("tenantId", "profileId") REFERENCES "shipping_profile"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "region" ADD CONSTRAINT "region_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "region_country" ADD CONSTRAINT "region_country_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "region_country" ADD CONSTRAINT "region_country_tenantId_regionId_fkey" FOREIGN KEY ("tenantId", "regionId") REFERENCES "region"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "region_country" ADD CONSTRAINT "region_country_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_rate" ADD CONSTRAINT "vat_rate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_rate" ADD CONSTRAINT "vat_rate_tenantId_regionId_fkey" FOREIGN KEY ("tenantId", "regionId") REFERENCES "region"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_rate" ADD CONSTRAINT "vat_rate_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_locale" ADD CONSTRAINT "tenant_locale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_locale" ADD CONSTRAINT "tenant_locale_localeCode_fkey" FOREIGN KEY ("localeCode") REFERENCES "locale"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_translation" ADD CONSTRAINT "catalog_product_translation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_translation" ADD CONSTRAINT "catalog_product_translation_tenantId_productId_fkey" FOREIGN KEY ("tenantId", "productId") REFERENCES "catalog_product"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_translation" ADD CONSTRAINT "catalog_product_translation_localeCode_fkey" FOREIGN KEY ("localeCode") REFERENCES "locale"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_translation" ADD CONSTRAINT "product_category_translation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_translation" ADD CONSTRAINT "product_category_translation_tenantId_categoryId_fkey" FOREIGN KEY ("tenantId", "categoryId") REFERENCES "product_category"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_translation" ADD CONSTRAINT "product_category_translation_localeCode_fkey" FOREIGN KEY ("localeCode") REFERENCES "locale"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_translation" ADD CONSTRAINT "product_tag_translation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_translation" ADD CONSTRAINT "product_tag_translation_tenantId_tagId_fkey" FOREIGN KEY ("tenantId", "tagId") REFERENCES "product_tag"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_translation" ADD CONSTRAINT "product_tag_translation_localeCode_fkey" FOREIGN KEY ("localeCode") REFERENCES "locale"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenantId_actorUserId_fkey" FOREIGN KEY ("tenantId", "actorUserId") REFERENCES "user"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_audit_log" ADD CONSTRAINT "auth_audit_log_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_object" ADD CONSTRAINT "file_object_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_link" ADD CONSTRAINT "file_link_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_link" ADD CONSTRAINT "file_link_tenantId_fileId_fkey" FOREIGN KEY ("tenantId", "fileId") REFERENCES "file_object"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_lifecycle_event" ADD CONSTRAINT "subscription_lifecycle_event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_lifecycle_event" ADD CONSTRAINT "subscription_lifecycle_event_tenantId_subscriptionId_fkey" FOREIGN KEY ("tenantId", "subscriptionId") REFERENCES "tenant_subscription"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount" ADD CONSTRAINT "discount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule" ADD CONSTRAINT "discount_rule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule" ADD CONSTRAINT "discount_rule_tenantId_discountId_fkey" FOREIGN KEY ("tenantId", "discountId") REFERENCES "discount"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule_value" ADD CONSTRAINT "discount_rule_value_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rule_value" ADD CONSTRAINT "discount_rule_value_tenantId_ruleId_fkey" FOREIGN KEY ("tenantId", "ruleId") REFERENCES "discount_rule"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_target" ADD CONSTRAINT "discount_target_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_target" ADD CONSTRAINT "discount_target_tenantId_discountId_fkey" FOREIGN KEY ("tenantId", "discountId") REFERENCES "discount"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_tenantId_discountId_fkey" FOREIGN KEY ("tenantId", "discountId") REFERENCES "discount"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_tenantId_checkoutId_fkey" FOREIGN KEY ("tenantId", "checkoutId") REFERENCES "checkout"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discount_application" ADD CONSTRAINT "order_discount_application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discount_application" ADD CONSTRAINT "order_discount_application_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "order"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_discount_application" ADD CONSTRAINT "order_discount_application_tenantId_discountId_fkey" FOREIGN KEY ("tenantId", "discountId") REFERENCES "discount"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slug" ADD CONSTRAINT "slug_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redirect" ADD CONSTRAINT "redirect_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_meta" ADD CONSTRAINT "seo_meta_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_meta" ADD CONSTRAINT "seo_meta_tenantId_ogImageFileId_fkey" FOREIGN KEY ("tenantId", "ogImageFileId") REFERENCES "file_object"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_event" ADD CONSTRAINT "search_event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_term_stat" ADD CONSTRAINT "search_term_stat_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_event" ADD CONSTRAINT "product_event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_daily_stat" ADD CONSTRAINT "product_daily_stat_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_daily_revenue" ADD CONSTRAINT "product_daily_revenue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_daily_revenue" ADD CONSTRAINT "product_daily_revenue_productDailyStatId_fkey" FOREIGN KEY ("productDailyStatId") REFERENCES "product_daily_stat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_tenantId_subscriptionId_fkey" FOREIGN KEY ("tenantId", "subscriptionId") REFERENCES "tenant_subscription"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_tenantId_invoicePdfFileId_fkey" FOREIGN KEY ("tenantId", "invoicePdfFileId") REFERENCES "file_object"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_company" ADD CONSTRAINT "tenant_company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_company" ADD CONSTRAINT "tenant_company_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "country"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_company" ADD CONSTRAINT "tenant_company_tenantId_logoFileId_fkey" FOREIGN KEY ("tenantId", "logoFileId") REFERENCES "file_object"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
