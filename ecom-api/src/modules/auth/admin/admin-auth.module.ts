import { Module } from "@nestjs/common";

import { AdminAuthController } from "@/modules/auth/admin/admin-auth.controller";
import { AdminAuthService } from "@/modules/auth/admin/admin-auth.service";

import { PrismaModule } from "@/prisma/prisma.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";
import { AdminAccessGuard } from "@/modules/auth/admin/guards/admin-access.guard";
import { AuthAuditLogModule } from "@/modules/auth/audit/auth-audit-log.module";
import { AuthRateLimitModule } from "@/modules/auth/rate-limit/auth-rate-limit.module";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { SecurityModule } from "@/infrastructure/security/security.module";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    CryptoModule,
    AuthAuditLogModule,
    AuthRateLimitModule,
    TenantBootstrapModule,
    SecurityModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAccessGuard, AdminAuthGuard],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminAuthModule {}
