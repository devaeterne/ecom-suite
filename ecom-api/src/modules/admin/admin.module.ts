import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { AdminTenantModule } from "@/modules/admin/tenant/admin-tenant.module";
import { AdminRbacModule } from "@/modules/admin/rbac/admin-rbac.module";
import { AdminIdentitiesModule } from "@/modules/admin/identities/admin-identities.module";
import { SecurityModule } from "@/infrastructure/security/security.module";
import { TenantContextMiddleware } from "@/infrastructure/tenant/tenant-context.middleware";

@Module({
  imports: [
    AdminTenantModule,
    AdminRbacModule,
    AdminIdentitiesModule,
    SecurityModule,
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes({ path: "api/admin/*", method: RequestMethod.ALL });
    // eğer global prefix'in varsa "admin/*" veya "/api/admin/*" değişebilir.
  }
}
