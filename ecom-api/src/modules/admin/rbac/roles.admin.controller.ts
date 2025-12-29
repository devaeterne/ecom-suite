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
import { RolesService } from "@/modules/admin/rbac/roles.service";
import { RoleCreateDto } from "@/modules/admin/rbac/dto/role-create.dto";
import { RoleUpdateDto } from "@/modules/admin/rbac/dto/role-update.dto";
import { RolePermissionsDto } from "@/modules/admin/rbac/dto/role-permissions.dto";

@Controller("admin/roles")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class RolesAdminController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission("rbac:read")
  async list(@Req() req: any) {
    return this.rolesService.listRoles(req.tenant.id);
  }

  @Post()
  @RequirePermission("rbac:write")
  async create(@Req() req: any, @Body() dto: RoleCreateDto) {
    return this.rolesService.createRole(req.tenant.id, dto);
  }

  @Patch(":id")
  @RequirePermission("rbac:write")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: RoleUpdateDto
  ) {
    return this.rolesService.updateRole(req.tenant.id, id, dto);
  }

  @Post(":id/permissions")
  @RequirePermission("rbac:write")
  async replacePermissions(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: RolePermissionsDto
  ) {
    return this.rolesService.replaceRolePermissions(req.tenant.id, id, dto);
  }
}
