import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";

import { CatalogRepo } from "@/modules/catalog/common/prisma/catalog.repo";

import { CatalogStoreController } from "@/modules/catalog/store/controllers/catalog.store.controller";
import { CatalogStoreService } from "@/modules/catalog/store/services/catalog.store.service";

import { CatalogAdminController } from "@/modules/catalog/admin/controllers/catalog.admin.controller";
import { CatalogAdminService } from "@/modules/catalog/admin/services/catalog.admin.service";

import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { ProductMediaRepository } from "./common/prisma/product.media.repo";
import { CollectionsAdminController } from "./admin/controllers/collections.admin.controller";
import { ProductCollectionsAdminController } from "./admin/controllers/product.collections.admin.controller";
import { TagsAdminController } from "./admin/controllers/tags.admin.controller";
import { ProductTagsAdminController } from "./admin/controllers/product.tags.admin.controller";
import { CollectionRepository } from "./collections/common/prisma/collection.repo";
import { CollectionsAdminService } from "./admin/services/collections.admin.service";
import { TagRepository } from "./tags/common/prisma/tag.repo";
import { TagsAdminService } from "./admin/services/tags.admin.service";
import { ProductTagsAdminService } from "./admin/services/product.tags.admin.service";
import { ProductCollectionsAdminService } from "./admin/services/product.collections.admin.service";

@Module({
  imports: [PrismaModule],
  controllers: [
    CatalogStoreController,
    CatalogAdminController,
    CollectionsAdminController,
    ProductCollectionsAdminController,
    TagsAdminController,
    ProductTagsAdminController,
  ],
  providers: [
    CatalogRepo,
    CatalogStoreService,
    CatalogAdminService,
    TenantHeaderGuard,
    ProductMediaRepository,
    CollectionRepository,
    CollectionsAdminService,
    TagRepository,
    TagsAdminService,
    ProductTagsAdminService,
    ProductCollectionsAdminService,
  ],
  exports: [CatalogRepo],
})
export class CatalogModule {}
