import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { SessionsModule } from "@/modules/sessions/sessions.module";
import { CryptoModule } from "@/modules/crypto/crypto.module";

import { StoreAuthController } from "@/modules/auth/store/store-auth.controller";
import { StoreAuthService } from "@/modules/auth/store/store-auth.service";
import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";
import { TenantBootstrapModule } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.module";

@Module({
  imports: [PrismaModule, SessionsModule, CryptoModule, TenantBootstrapModule],
  controllers: [StoreAuthController],
  providers: [StoreAuthService, StoreAccessGuard],
})
export class StoreAuthModule {}
