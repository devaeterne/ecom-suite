-- CreateTable
CREATE TABLE "payment_webhook_event" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "eventId" TEXT NOT NULL,
    "externalRef" TEXT,
    "status" "PaymentStatus",
    "signature" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,

    CONSTRAINT "payment_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_webhook_event_tenantId_provider_externalRef_idx" ON "payment_webhook_event"("tenantId", "provider", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_event_tenantId_provider_eventId_key" ON "payment_webhook_event"("tenantId", "provider", "eventId");
