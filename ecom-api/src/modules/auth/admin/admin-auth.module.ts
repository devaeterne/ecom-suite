import { Module } from "@nestjs/common";

import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";

import { PrismaModule } from "@/prisma/prisma.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";
import { AdminAccessGuard } from "@/modules/auth/admin/guards/admin-access.guard";

@Module({
  imports: [PrismaModule, SessionsModule, CryptoModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAccessGuard],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
