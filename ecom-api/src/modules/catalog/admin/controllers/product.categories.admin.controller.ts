import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { AdminReplaceProductCategoriesDto } from "@/modules/catalog/admin/dto/admin.product.categories.dto";
import { ProductCategoriesAdminService } from "@/modules/catalog/admin/services/product.categories.admin.service";

@Controller("/admin/products")
@UseGuards(AdminAuthGuard, TenantHeaderGuard)
export class ProductCategoriesAdminController {
  constructor(private readonly service: ProductCategoriesAdminService) {}

  @Post("/:id/categories")
  async replaceCategories(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminReplaceProductCategoriesDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.replaceCategories({
      tenantId,
      productId,
      categoryIds: dto.categoryIds ?? [],
    });
  }
}
