import { Module } from "@nestjs/common";
import { ActiveTenantService } from "./active-tenant.service";
import { TenantConfigService } from "./tenant-config.service";
import { TenantBootstrapService } from "./tenant-bootstrap.service";

@Module({
  providers: [ActiveTenantService, TenantConfigService, TenantBootstrapService],
  exports: [ActiveTenantService, TenantConfigService],
})
export class TenantBootstrapModule {}
