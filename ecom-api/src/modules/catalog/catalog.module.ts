import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";

import { CatalogStoreController } from "@/modules/catalog/store/controllers/catalog.store.controller";
import { CatalogStoreService } from "@/modules/catalog/store/services/catalog.store.service";

import { CatalogAdminController } from "@/modules/catalog/admin/controllers/catalog.admin.controller";
import { CatalogAdminService } from "@/modules/catalog/admin/service/catalog.admin.service";

import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";

@Module({
  imports: [PrismaModule],
  controllers: [CatalogStoreController, CatalogAdminController],
  providers: [
    CatalogRepo,
    CatalogStoreService,
    CatalogAdminService,
    TenantHeaderGuard,
  ],
  exports: [CatalogRepo],
})
export class CatalogModule {}
