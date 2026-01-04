import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";

import { StoreAuthController } from "@/modules/auth/store/store/controllers/store-auth.controller";
import { StoreAuthService } from "@/modules/auth/store/store/services/store-auth.service";
import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { AuthAuditLogModule } from "@/modules/auth/audit/auth-audit-log.module";
import { AuthRateLimitModule } from "@/modules/auth/rate-limit/auth-rate-limit.module";

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    CryptoModule,
    TenantBootstrapModule,
    AuthAuditLogModule,
    AuthAuditLogModule,
    AuthRateLimitModule,
  ],
  controllers: [StoreAuthController],
  providers: [StoreAuthService, StoreAccessGuard],
  exports: [StoreAccessGuard], // <-- ADD THIS LINE
})
export class StoreAuthModule {}
