import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";
import { TenantService } from "@/modules/admin/tenant/tenant.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/dto/tenant-me.patch.dto";
import { presentTenant } from "@/modules/admin/tenant/mappers/tenant.presenter";

@Controller("admin/tenants")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class TenantAdminController {
  constructor(private readonly svc: TenantService) {}

  @Get("me")
  @RequirePermission("tenant:read")
  async me(@Req() req: any) {
    const t = await this.svc.getMe(req.tenant.id);
    return presentTenant(t);
  }

  @Patch("me")
  @RequirePermission("tenant:write")
  async patchMe(@Req() req: any, @Body() dto: TenantMePatchDto) {
    const t = await this.svc.patchMe(req.tenant.id, dto);
    return presentTenant(t);
  }
}
