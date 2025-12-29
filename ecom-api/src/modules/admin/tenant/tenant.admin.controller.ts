import { Controller, Get, Patch, Body, Req, UseGuards } from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { TenantMePatchDto } from "@modules/admin/dto/tenant-me.patch.dto";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";

@Controller("api/admin/tenants")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class TenantAdminController {
  constructor(private readonly tenantService: TenantService) {}

  @Get("me")
  @RequirePermission("tenant:read")
  async me(@Req() req: any) {
    return this.tenantService.getMe(req.tenant.id);
  }

  @Patch("me")
  @RequirePermission("tenant:write")
  async updateMe(@Req() req: any, @Body() dto: TenantMePatchDto) {
    return this.tenantService.updateMe(req.tenant.id, dto);
  }
}
