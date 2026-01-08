import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  Get,
  UseGuards,
  Query,
} from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";
import { CatalogAdminService } from "@/modules/catalog/admin/services/catalog.admin.service";
import {
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
  AdminCategoryListQueryDto,
} from "@/modules/catalog/admin/dto/admin-category.dto";
import {
  AdminCreateProductDto,
  AdminUpdateProductDto,
  AdminProductListQueryDto,
} from "@/modules/catalog/admin/dto/admin-product.dto";

@Controller("/admin")
@UseGuards(AdminAuthGuard, TenantGuard)
export class CatalogAdminController {
  constructor(private readonly service: CatalogAdminService) {}

  @Post("/categories")
  async createCategory(
    @Req() req: Request,
    @Body() dto: AdminCreateCategoryDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.createCategory(tenantId, dto);
  }

  @Patch("/categories/:id")
  async updateCategory(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateCategoryDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.updateCategory(tenantId, id, dto);
  }

  @Post("/products")
  async createProduct(@Req() req: Request, @Body() dto: AdminCreateProductDto) {
    const tenantId = requireTenantId(req as any);
    return this.service.createProduct(tenantId, dto);
  }

  @Patch("/products/:id")
  async updateProduct(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateProductDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.updateProduct(tenantId, id, dto);
  }

  @Post("/products/:id/publish")
  async publishProduct(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.publishProduct(tenantId, id);
  }

  @Get("/categories")
  async listCategories(
    @Req() req: Request,
    @Query() q: AdminCategoryListQueryDto
  ) {
    return this.service.listCategories(req, q);
  }

  @Get("/categories/:id")
  async getCategory(@Req() req: Request, @Param("id") id: string) {
    return this.service.getCategory(req, id);
  }

  @Get("/products")
  async listProducts(
    @Req() req: Request,
    @Query() q: AdminProductListQueryDto
  ) {
    return this.service.listProducts(req, q);
  }

  @Get("/products/:id")
  async getProduct(@Req() req: Request, @Param("id") id: string) {
    return this.service.getProduct(req, id);
  }

  @Get("/products/:id/variants")
  async listProductVariants(
    @Req() req: Request,
    @Param("id") productId: string
  ) {
    return this.service.listVariantsByProduct(req, productId);
  }
}
