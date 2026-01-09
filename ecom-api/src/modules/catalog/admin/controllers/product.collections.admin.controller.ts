import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { getTenantIdOrThrow } from "@/modules/catalog/common/tenant/tenant.util";
import { AdminReplaceProductCollectionsDto } from "@/modules/catalog/admin/dto/admin.product.collections.dto";
import { ProductCollectionsAdminService } from "@/modules/catalog/admin/services/product.collections.admin.service";

@Controller("/admin/products")
export class ProductCollectionsAdminController {
  constructor(private readonly service: ProductCollectionsAdminService) {}

  @Post(":id/collections")
  async replaceCollections(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminReplaceProductCollectionsDto
  ) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.replaceCollections({
      tenantId,
      productId,
      collectionIds: dto.collectionIds ?? [],
    });
  }
}
