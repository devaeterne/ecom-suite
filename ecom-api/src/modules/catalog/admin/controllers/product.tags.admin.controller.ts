import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { AdminReplaceProductTagsDto } from "@/modules/catalog/admin/dto/admin.product.tag.dto";
import { ProductTagsAdminService } from "@/modules/catalog/admin/services/product.tags.admin.service";

function tenant(req: Request) {
  return requireTenantId(req as any);
}

@Controller("/admin/products")
@UseGuards(AdminAuthGuard, TenantHeaderGuard)
export class ProductTagsAdminController {
  constructor(private readonly service: ProductTagsAdminService) {}

  @Post("/:productId/tags")
  async replaceTags(
    @Req() req: Request,
    @Param("productId") productId: string,
    @Body() dto: AdminReplaceProductTagsDto,
  ) {
    const tenantId = tenant(req);

    return this.service.replaceTags({
      tenantId,
      productId,
      tagIds: dto.tagIds ?? [],
    });
  }
}
