import { Global, Module } from "@nestjs/common";
import { HashService } from "@/infrastructure/security/hash.service";
import { TokenService } from "@/infrastructure/security/token.service";
import { PrismaService } from "@/prisma";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";

@Global()
@Module({
  providers: [HashService, TokenService, PrismaService, AdminAuthGuard],
  exports: [HashService, TokenService, PrismaService, AdminAuthGuard],
})
export class SecurityModule {}
