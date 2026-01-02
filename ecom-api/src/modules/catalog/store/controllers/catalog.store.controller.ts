import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { CatalogStoreService } from "@/modules/catalog/store/services/catalog.store.service";
import { PaginationQueryDto } from "@/modules/catalog/common/dto/pagination.dto";

@Controller("/store")
@UseGuards(TenantHeaderGuard)
export class CatalogStoreController {
  constructor(private readonly service: CatalogStoreService) {}

  @Get("/categories")
  async listCategories(@Req() req: Request, @Query("tree") tree?: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.listCategories(
      tenantId,
      tree === "1" || tree === "true"
    );
  }

  @Get("/categories/:id")
  async getCategory(@Req() req: Request, @Param("id") id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.getCategory(tenantId, id);
  }

  @Get("/collections")
  async listCollections(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.service.listCollections(tenantId);
  }

  @Get("/brands")
  async listBrands(@Req() req: Request) {
    const tenantId = (req as any).tenantId as string;
    return this.service.listBrands(tenantId);
  }

  @Get("/products")
  async listProducts(
    @Req() req: Request,
    @Query() pag: PaginationQueryDto,
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("collectionId") collectionId?: string
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.service.listProducts(tenantId, {
      offset: pag.offset ?? 0,
      limit: pag.limit ?? 20,
      q,
      categoryId,
      collectionId,
    });
  }

  @Get("/products/:id")
  async getProduct(@Req() req: Request, @Param("id") id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.getProduct(tenantId, id);
  }

  @Get("/products/:id/variants")
  async getVariants(@Req() req: Request, @Param("id") id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.getProductVariants(tenantId, id);
  }
}
