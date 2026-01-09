import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { getTenantIdOrThrow } from "@/modules/catalog/common/tenant/tenant.util";
import { AdminReplaceProductTagsDto } from "@/modules/catalog/admin/dto/admin.product.tag.dto";
import { ProductTagsAdminService } from "@/modules/catalog/admin/services/product.tags.admin.service";

@Controller("/admin/products")
export class ProductTagsAdminController {
  constructor(private readonly service: ProductTagsAdminService) {}

  @Post(":id/tags")
  async replaceTags(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminReplaceProductTagsDto
  ) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.replaceTags({
      tenantId,
      productId,
      tagIds: dto.tagIds,
    });
  }
}
