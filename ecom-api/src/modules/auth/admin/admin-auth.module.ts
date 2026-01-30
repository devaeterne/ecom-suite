import { Module } from "@nestjs/common";

import { AdminAuthController } from "@/modules/auth/admin/admin/controllers/admin-auth.controller";
import { AdminAuthService } from "@/modules/auth/admin/admin/services/admin-auth.service";

import { PrismaModule } from "@/prisma/prisma.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { AuthAuditLogModule } from "@/modules/auth/audit/auth-audit-log.module";
import { AuthRateLimitModule } from "@/modules/auth/rate-limit/auth-rate-limit.module";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { SecurityModule } from "@/infrastructure/security/security.module";

import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { AdminMeController } from "./admin/controllers/me.admin.controller";
import { AdminMeService } from "./admin/services/admin-me.service";

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    AuthAuditLogModule,
    AuthRateLimitModule,
    TenantBootstrapModule,
    SecurityModule,
  ],
  controllers: [AdminAuthController, AdminMeController],
  providers: [
    AdminAuthService,
    AdminAccessGuard,
    AdminAuthGuard,
    AdminMeService,
  ],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminAuthModule {}
