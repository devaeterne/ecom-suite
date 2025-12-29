import { Module } from "@nestjs/common";

import { AdminAuthController } from "@/modules/auth/admin/admin-auth.controller";
import { AdminAuthService } from "@/modules/auth/admin/admin-auth.service";

import { PrismaModule } from "@/prisma/prisma.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";
import { AdminAccessGuard } from "@/modules/auth/admin/guards/admin-access.guard";
import { AuthAuditLogModule } from "@/modules/auth/audit/auth-audit-log.module";
import { AuthRateLimitModule } from "../rate-limit/auth-rate-limit-module";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    CryptoModule,
    AuthAuditLogModule,
    AuthRateLimitModule,
    TenantBootstrapModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAccessGuard],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
