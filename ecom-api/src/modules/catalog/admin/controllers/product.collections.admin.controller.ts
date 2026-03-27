import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { AdminReplaceProductCollectionsDto } from "@/modules/catalog/admin/dto/admin.product.collections.dto";
import { ProductCollectionsAdminService } from "@/modules/catalog/admin/services/product.collections.admin.service";

function tenant(req: Request) {
  return requireTenantId(req as any);
}

@Controller("/admin/products")
@UseGuards(AdminAuthGuard, TenantGuard)
export class ProductCollectionsAdminController {
  constructor(private readonly service: ProductCollectionsAdminService) {}

  @Post("/:id/collections")
  async replaceCollections(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminReplaceProductCollectionsDto,
  ) {
    const tenantId = tenant(req);

    const collectionIds = Array.from(
      new Set(
        (dto.collectionIds ?? []).map((x) => String(x).trim()).filter(Boolean),
      ),
    );

    return this.service.replaceCollections({
      tenantId,
      productId,
      collectionIds,
    });
  }
}
