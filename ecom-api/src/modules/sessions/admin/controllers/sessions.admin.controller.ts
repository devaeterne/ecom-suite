// src/modules/sessions/admin/controllers/sessions.admin.controller.ts
import { Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import type { AdminAuthContext } from "@/modules/auth/admin/common/types/admin-request";
import { SessionsAdminService } from "@/modules/sessions/admin/services/sessions.admin.service";

@Controller("/admin/sessions")
@UseGuards(AdminAccessGuard)
export class SessionsAdminController {
  constructor(private readonly service: SessionsAdminService) {}

  @Get()
  async list(@Req() req: AdminAuthContext) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    const identityId = req.identityId ?? req.adminId ?? req.user?.sub;

    return this.service.listActive({ tenantId, identityId });
  }

  @Post(":id/revoke")
  async revokeOne(@Req() req: AdminAuthContext, @Param("id") id: string) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    const identityId = req.identityId ?? req.adminId ?? req.user?.sub;

    return this.service.revokeOne({ tenantId, identityId, sessionId: id });
  }

  @Post("revoke-all")
  async revokeAll(@Req() req: AdminAuthContext) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    const identityId = req.identityId ?? req.adminId ?? req.user?.sub;

    return this.service.revokeAll({ tenantId, identityId });
  }
}
