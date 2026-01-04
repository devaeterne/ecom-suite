import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";

import { TenantService } from "@/modules/admin/tenant/admin/services/tenant.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/common/dto/tenant-me.patch.dto";
import { presentTenant } from "@/modules/admin/tenant/common/mappers/tenant.presenter";

function getTenantId(req: any) {
  const tenantId = req.user?.tenantId ?? req.tenant?.id ?? null;
  if (!tenantId) throw new BadRequestException("Tenant context missing");
  return tenantId;
}

@Controller("admin/tenants")
@UseGuards(AdminAccessGuard, PermissionGuard)
export class TenantAdminController {
  constructor(private readonly svc: TenantService) {}

  @Get("me")
  @RequirePermission("admin:tenant:read")
  async me(@Req() req: any) {
    const tenantId = getTenantId(req);
    const t = await this.svc.getMe(tenantId);
    return presentTenant(t);
  }

  @Patch("me")
  @RequirePermission("admin:tenant:update")
  async patchMe(@Req() req: any, @Body() dto: TenantMePatchDto) {
    const tenantId = getTenantId(req);
    const t = await this.svc.patchMe(tenantId, dto);
    return presentTenant(t);
  }
}
