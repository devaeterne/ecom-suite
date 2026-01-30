import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";

import { SuperAdminGuard } from "@/infrastructure/auth/guards/super-admin.guard";
import { AdminAuditService } from "@/infrastructure/audit/admin-audit.service";

import { TenantService } from "@/modules/admin/tenant/admin/services/tenant.service";
import { TenantMePatchDto } from "@/modules/admin/tenant/common/dto/tenant-me.patch.dto";
import {
  presentTenant,
  presentTenantMeBundle,
} from "@/modules/admin/tenant/common/mappers/tenant.presenter";

import { AuditAction } from "@prisma/client";

export function requireAdminTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.user?.tenantId ?? req?.tenantId;
  if (!tenantId) throw new ForbiddenException("Tenant context missing");
  return String(tenantId);
}

type SwitchTenantDto = {
  targetTenantId?: string;
  targetTenantCode?: string;
};

@Controller("admin/tenants")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class TenantAdminController {
  constructor(
    private readonly svc: TenantService,
    private readonly audit: AdminAuditService,
  ) {}

  /**
   * Admin bootstrap endpoint (panel açılışı için).
   * Permission'a bağlamıyoruz; authenticated admin yeterli.
   */
  @Get("me")
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

  /**
   * Super admin only: list tenants (for switcher)
   * GET /api/admin/tenants
   *
   * Not: class-level PermissionGuard var.
   * Super admin check'i method-level'da erken çalıştırıyoruz.
   */
  @Get()
  @UseGuards(AdminAuthGuard, SuperAdminGuard)
  async list(@Req() req: any) {
    const tenantId = requireAdminTenantId(req);

    const items = await this.svc.listTenantsForSwitcher();

    await this.audit.log(req, {
      action: AuditAction.TENANT_LIST,
      tenantId,
      actorUserId: req?.user?.id ?? req?.user?.userId ?? null,
      entityType: "tenant",
      metadata: { resultCount: items.length },
      source: "admin",
    });

    return { items };
  }

  /**
   * Super admin only: log explicit switch event
   * POST /api/admin/tenants/switch
   */
  @Post("switch")
  @UseGuards(AdminAuthGuard, SuperAdminGuard)
  async switchTenant(@Req() req: any, @Body() dto: SwitchTenantDto) {
    const currentTenantId = requireAdminTenantId(req);

    const target = await this.svc.resolveTenantTarget(dto);

    await this.audit.log(req, {
      action: AuditAction.TENANT_SWITCH,
      tenantId: currentTenantId,
      actorUserId: req?.user?.id ?? req?.user?.userId ?? null,
      entityType: "tenant",
      entityId: target.id,
      entityLabel: target.name ?? target.code ?? null,
      metadata: {
        fromTenantId: currentTenantId,
        toTenantId: target.id,
        toTenantCode: target.code,
      },
      source: "admin",
    });

    return { ok: true };
  }
}
