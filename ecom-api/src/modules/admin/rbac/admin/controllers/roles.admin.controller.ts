import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";
import { RolesService } from "@/modules/admin/rbac/admin/services/roles.service";
import { RolePermissionsDto } from "@/modules/admin/rbac/common/dto/role-permissions.dto";
import { RoleCreateDto } from "@/modules/admin/rbac/common/dto/role-create.dto";
import { RolePatchDto } from "@/modules/admin/rbac/common/dto/role-patch.dto";

function tenantId(req: any) {
  return req.tenant?.id ?? req.tenantId ?? req.user?.tenantId;
}
@Controller("/admin/roles")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class RolesAdminController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission("admin:roles:read")
  async list(@Req() req: any) {
    return this.rolesService.listRoles(req.tenant.id);
  }

  @Post()
  @RequirePermission("admin:roles:create")
  async create(@Req() req: any, @Body() dto: RoleCreateDto) {
    return this.rolesService.createRole(req.tenant.id, dto);
  }

  @Patch(":id")
  @RequirePermission("admin:roles:update")
  async patch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: RolePatchDto,
  ) {
    return this.rolesService.updateRole(req.tenant.id, id, dto);
  }

  @Post(":id/permissions")
  @RequirePermission("admin:roles:permissions")
  async setPermissions(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: RolePermissionsDto,
  ) {
    return this.rolesService.setRolePermissions(req.tenant.id, id, dto);
  }
}
