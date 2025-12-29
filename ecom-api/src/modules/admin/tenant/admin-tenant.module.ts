import { Module, MiddlewareConsumer } from "@nestjs/common";
import { TenantAdminController } from "./tenant.admin.controller";
import { TenantService } from "@/modules/admin/tenant/tenant.service";
import { PrismaService } from "@/prisma/prisma.service";
import { TenantContextMiddleware } from "@/infrastructure/tenant/tenant-context.middleware";

@Module({
  controllers: [TenantAdminController],
  providers: [TenantService, PrismaService],
})
export class AdminTenantModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes(TenantAdminController);
  }
}
