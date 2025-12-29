import { Module } from "@nestjs/common";
import { AdminTenantModule } from "@/modules/admin/tenant/admin-tenant.module";
import { AdminRbacModule } from "@/modules/admin/rbac/admin-rbac.module";

@Module({
  imports: [AdminTenantModule, AdminRbacModule],
})
export class AdminModule {}
