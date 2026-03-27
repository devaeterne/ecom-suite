import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { AdminReplaceProductCategoriesDto } from "@/modules/catalog/admin/dto/admin.product.categories.dto";
import { ProductCategoriesAdminService } from "@/modules/catalog/admin/services/product.categories.admin.service";

function tenant(req: Request) {
  return requireTenantId(req as any);
}

@Controller("/admin/products")
@UseGuards(AdminAuthGuard, TenantGuard)
export class ProductCategoriesAdminController {
  constructor(private readonly service: ProductCategoriesAdminService) {}

  @Post("/:id/categories")
  async replaceCategories(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminReplaceProductCategoriesDto,
  ) {
    const tenantId = tenant(req);

    const categoryIds = Array.from(
      new Set(
        (dto.categoryIds ?? []).map((x) => String(x).trim()).filter(Boolean),
      ),
    );

    return this.service.replaceCategories({
      tenantId,
      productId,
      categoryIds,
    });
  }
}
