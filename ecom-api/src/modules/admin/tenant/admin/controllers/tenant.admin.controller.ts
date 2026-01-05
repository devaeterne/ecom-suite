import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";

import { TenantService } from "@/modules/admin/tenant/admin/services/tenant.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/common/dto/tenant-me.patch.dto";
import { presentTenant } from "@/modules/admin/tenant/common/mappers/tenant.presenter";

export function getTenantId(req: any): string {
  // AdminAuthGuard sonrası bunlar dolu olur:
  const fromToken = req?.user?.tenantId;
  if (fromToken) return fromToken;

  const fromCtx = req?.tenant?.id ?? req?.tenantId;
  if (fromCtx) return fromCtx;

  const h = req?.headers ?? {};
  const fromHeader =
    h["x-tenant-id"] ??
    h["x-tenantid"] ??
    h["x-tenant"] ??
    h["X-Tenant-Id"] ??
    h["X-Tenant"] ??
    null;

  if (fromHeader) return String(fromHeader);

  throw new ForbiddenException("Tenant or user context missing");
}

@Controller("admin/tenants")
// ✅ RBAC isteyen admin endpoint’lerde AdminAuthGuard kullan
@UseGuards(AdminAuthGuard, PermissionGuard)
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
