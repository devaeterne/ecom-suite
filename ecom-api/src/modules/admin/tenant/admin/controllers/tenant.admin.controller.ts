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

import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { SuperAdminGuard } from "@/infrastructure/auth/guards/super-admin.guard"; // ✅ path sende farklıysa düzelt

import { TenantService } from "@/modules/admin/tenant/admin/services/tenant.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/common/dto/tenant-me.patch.dto";
import {
  presentTenant,
  presentTenantMeBundle,
} from "@/modules/admin/tenant/common/mappers/tenant.presenter";

export function requireAdminTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.user?.tenantId ?? req?.tenantId;
  if (!tenantId) {
    throw new ForbiddenException("Tenant context missing");
  }
  return String(tenantId);
}

@Controller("admin/tenants")
@UseGuards(AdminAuthGuard, TenantHeaderGuard, PermissionGuard) // ✅ sıralama önemli
export class TenantAdminController {
  constructor(private readonly svc: TenantService) {}

  /**
   * Super admin: all tenants list
   * GET /api/admin/tenants
   *
   * Not: Method-level UseGuards, class-level guard setini override eder.
   * Burada PermissionGuard istemiyoruz; SuperAdminGuard ile kilitli.
   */
  @Get()
  @UseGuards(AdminAuthGuard, TenantHeaderGuard, SuperAdminGuard)
  async listTenants() {
    const items = await this.svc.listTenantsForSuperAdmin();
    // response shape: { items: [{ id, code, name, isActive }] }
    return { items: items.map(presentTenant) };
  }

  @Get("me")
  @RequirePermission("admin:tenant:read")
  async me(@Req() req: any) {
    const tenantId = requireAdminTenantId(req);
    const bundle = await this.svc.getMeBundle(tenantId);
    return presentTenantMeBundle(bundle);
  }

  @Patch("me")
  @RequirePermission("admin:tenant:update")
  async patchMe(@Req() req: any, @Body() dto: TenantMePatchDto) {
    const tenantId = requireAdminTenantId(req);
    const t = await this.svc.patchMe(tenantId, dto);
    return presentTenant(t);
  }
}
