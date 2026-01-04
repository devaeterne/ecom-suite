import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionsService } from "@/modules/admin/rbac/admin/services/permissions.service";

@Controller("admin/permissions")
@UseGuards(AdminAuthGuard)
export class PermissionsAdminController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async list() {
    return this.permissionsService.listAll();
  }
}
