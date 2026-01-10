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
import { ProductCategoriesAdminController } from "./admin/controllers/product.categories.admin.controller";
import { ProductCategoriesAdminService } from "./admin/services/product.categories.admin.service";
import { ProductTranslationsAdminController } from "./admin/controllers/product.translations.admin.controller";
import { ProductTranslationRepository } from "./translations/common/prisma/product.translation.repo";
import { ProductTranslationsAdminService } from "./admin/services/product.translations.admin.service";
import { CategoryTranslationsAdminController } from "./admin/controllers/category.translations.admin.controller";
import { CategoryTranslationsAdminService } from "./admin/services/category.translations.admin.service";
import { CategoryTranslationRepository } from "./translations/common/prisma/category.translations.repo";

@Module({
  imports: [PrismaModule],
  controllers: [
    CatalogStoreController,
    CatalogAdminController,
    CollectionsAdminController,
    ProductCollectionsAdminController,
    TagsAdminController,
    ProductTagsAdminController,
    ProductCategoriesAdminController,
    ProductTranslationsAdminController,
    CategoryTranslationsAdminController,
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
    ProductCategoriesAdminService,
    ProductTranslationsAdminService,
    ProductTranslationRepository,
    CategoryTranslationsAdminService,
    CategoryTranslationRepository,
  ],
  exports: [CatalogRepo],
})
export class CatalogModule {}
