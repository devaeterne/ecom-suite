-- AlterTable
ALTER TABLE "auth_identity" ADD COLUMN     "passwordAlgo" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordUpdatedAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_auth_identity_tenant_provider" ON "auth_identity"("tenantId", "provider", "providerId");

