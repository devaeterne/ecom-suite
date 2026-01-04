import { Module, MiddlewareConsumer } from "@nestjs/common";
import { TenantAdminController } from "@/modules/admin/tenant/admin/controllers/tenant.admin.controller";
import { TenantService } from "@/modules/admin/tenant/admin/services/tenant.service";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantContextMiddleware } from "@/infrastructure/tenant/tenant-context.middleware";
import { AdminAuthModule } from "@/modules/auth/admin/admin-auth.module";
import { SecurityModule } from "@/infrastructure/security/security.module";

@Module({
  imports: [AdminAuthModule, SecurityModule],
  controllers: [TenantAdminController],
  providers: [TenantService, PrismaService],
})
export class AdminTenantModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes(TenantAdminController);
  }
}
