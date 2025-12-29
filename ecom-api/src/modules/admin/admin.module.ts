import { Module } from "@nestjs/common";
import { AdminTenantModule } from "./tenant/admin-tenant.module";

@Module({
  imports: [AdminTenantModule],
})
export class AdminModule {}
