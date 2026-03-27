import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";
import { PermissionsService } from "@/modules/admin/rbac/admin/services/permissions.service";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";

@Controller("/admin/permissions")
@UseGuards(AdminAuthGuard, TenantGuard, PermissionGuard)
export class PermissionsAdminController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission("admin:permissions:read")
  async list(@Req() req: any) {
    return this.permissionsService.listForTenant(req.tenant.id);
  }
}
