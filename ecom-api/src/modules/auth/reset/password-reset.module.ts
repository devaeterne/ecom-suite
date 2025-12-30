import { Module } from "@nestjs/common";
import { PasswordResetController } from "@/modules/auth/reset/password-reset.controller";
import { PasswordResetService } from "@/modules/auth/reset/password-reset.service";

import { PrismaModule } from "@/prisma/prisma.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { SecurityModule } from "@/infrastructure/security/security.module";
import { AuthRateLimitModule } from "@/modules/auth/rate-limit/auth-rate-limit.module";
import { AuthAuditLogModule } from "@/modules/auth/audit/auth-audit-log.module";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";
import { MailModule } from "@/infrastructure/mail/mail.module"; // ✅ EKLE

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    CryptoModule,
    SecurityModule,
    AuthRateLimitModule,
    AuthAuditLogModule,
    TenantBootstrapModule,
    MailModule, // ✅ EKLE
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService], // ✅ TEK KERE
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
