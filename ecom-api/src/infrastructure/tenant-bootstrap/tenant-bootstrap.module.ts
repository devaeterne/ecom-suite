import { Module } from "@nestjs/common";
import { ActiveTenantService } from "@/infrastructure/tenant-bootstrap/active-tenant.service";
import { TenantConfigService } from "@/infrastructure/tenant-bootstrap/tenant-config.service";
import { TenantBootstrapService } from "@/infrastructure/tenant-bootstrap/tenant-bootstrap.service";

@Module({
  providers: [ActiveTenantService, TenantConfigService, TenantBootstrapService],
  exports: [ActiveTenantService, TenantConfigService, TenantBootstrapService],
})
export class TenantBootstrapModule {}
