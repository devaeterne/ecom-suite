
-- CreateTable
CREATE TABLE IF NOT EXISTS "password_reset_token" (
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
CREATE TABLE IF NOT EXISTS "auth_audit_log" (
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
  "meta" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_audit_log_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_token_tokenHash_key" ON "password_reset_token"("tokenHash");
CREATE INDEX IF NOT EXISTS "password_reset_token_tenantId_idx" ON "password_reset_token"("tenantId");
CREATE INDEX IF NOT EXISTS "password_reset_token_identityId_idx" ON "password_reset_token"("identityId");
CREATE INDEX IF NOT EXISTS "password_reset_token_expiresAt_idx" ON "password_reset_token"("expiresAt");

CREATE INDEX IF NOT EXISTS "auth_audit_log_tenantId_idx" ON "auth_audit_log"("tenantId");
CREATE INDEX IF NOT EXISTS "auth_audit_log_action_idx" ON "auth_audit_log"("action");
CREATE INDEX IF NOT EXISTS "auth_audit_log_createdAt_idx" ON "auth_audit_log"("createdAt");

-- Foreign keys (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_token_tenantId_fkey') THEN
    ALTER TABLE "password_reset_token"
      ADD CONSTRAINT "password_reset_token_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_token_identityId_fkey') THEN
    ALTER TABLE "password_reset_token"
      ADD CONSTRAINT "password_reset_token_identityId_fkey"
      FOREIGN KEY ("identityId") REFERENCES "auth_identity"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auth_audit_log_tenantId_fkey') THEN
    ALTER TABLE "auth_audit_log"
      ADD CONSTRAINT "auth_audit_log_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

