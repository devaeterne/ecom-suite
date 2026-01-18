// src/modules/admin/tenant/admin/controllers/tenant.admin.controller.ts

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

/**
 * Admin tarafında tenantId kaynağı:
 * - AdminAuthGuard (ve/veya tenant middleware/guard) tenant context'i set eder.
 * - Controller'da header parse ederek yeni bir surface açmayalım.
 */
export function requireAdminTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.user?.tenantId ?? req?.tenantId;
  if (!tenantId) {
    throw new ForbiddenException("Tenant context missing");
  }
  return String(tenantId);
}

@Controller("admin/tenants")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class TenantAdminController {
  constructor(private readonly svc: TenantService) {}

  @Get("me")
  @RequirePermission("admin:tenant:read")
  async me(@Req() req: any) {
    const tenantId = requireAdminTenantId(req);
    const t = await this.svc.getMe(tenantId);
    return presentTenant(t);
  }

  @Patch("me")
  @RequirePermission("admin:tenant:update")
  async patchMe(@Req() req: any, @Body() dto: TenantMePatchDto) {
    const tenantId = requireAdminTenantId(req);
    const t = await this.svc.patchMe(tenantId, dto);
    return presentTenant(t);
  }
}
