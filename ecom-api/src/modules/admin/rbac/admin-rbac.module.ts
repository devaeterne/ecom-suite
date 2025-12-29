import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

import { PermissionsService } from "@/modules/admin/rbac/permissions.service";
import { PermissionsAdminController } from "@/modules/admin/rbac/permissions.admin.controller";

import { RolesService } from "@/modules/admin/rbac/roles.service";
import { RolesAdminController } from "@/modules/admin/rbac/roles.admin.controller";
import { RbacBootstrapAdminController } from "./bootstrap.admin.controller";

@Module({
  controllers: [
    PermissionsAdminController,
    RolesAdminController,
    RbacBootstrapAdminController,
  ],
  providers: [PrismaService, PermissionsService, RolesService],
  exports: [PermissionsService, RolesService],
})
export class AdminRbacModule {}
