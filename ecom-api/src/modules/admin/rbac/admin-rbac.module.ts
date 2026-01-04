import { Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

import { PermissionsService } from "@/modules/admin/rbac/admin/services/permissions.service";
import { PermissionsAdminController } from "@/modules/admin/rbac/admin/controllers/permissions.admin.controller";

import { RolesService } from "@/modules/admin/rbac/admin/services/roles.service";
import { RolesAdminController } from "@/modules/admin/rbac/admin/controllers/roles.admin.controller";
import { RbacBootstrapAdminController } from "@/modules/admin/rbac/admin/controllers/bootstrap.admin.controller";
import { SecurityModule } from "@/infrastructure/security/security.module";

@Module({
  imports: [SecurityModule],
  controllers: [
    PermissionsAdminController,
    RolesAdminController,
    RbacBootstrapAdminController,
  ],
  providers: [PrismaService, PermissionsService, RolesService],
  exports: [PermissionsService, RolesService],
})
export class AdminRbacModule {}
