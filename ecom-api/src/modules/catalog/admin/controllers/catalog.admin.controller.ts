import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { CatalogAdminService } from "@/modules/catalog/admin/service/catalog.admin.service";
import {
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
} from "@/modules/catalog/admin/dto/admin-category.dto";
import {
  AdminCreateProductDto,
  AdminUpdateProductDto,
} from "@/modules/catalog/admin/dto/admin-product.dto";

@Controller("/api/admin")
@UseGuards(TenantHeaderGuard)
export class CatalogAdminController {
  constructor(private readonly service: CatalogAdminService) {}

  @Post("/categories")
  async createCategory(
    @Req() req: Request,
    @Body() dto: AdminCreateCategoryDto
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.service.createCategory(tenantId, dto);
  }

  @Patch("/categories/:id")
  async updateCategory(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateCategoryDto
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.service.updateCategory(tenantId, id, dto);
  }

  @Post("/products")
  async createProduct(@Req() req: Request, @Body() dto: AdminCreateProductDto) {
    const tenantId = (req as any).tenantId as string;
    return this.service.createProduct(tenantId, dto);
  }

  @Patch("/products/:id")
  async updateProduct(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateProductDto
  ) {
    const tenantId = (req as any).tenantId as string;
    return this.service.updateProduct(tenantId, id, dto);
  }

  @Post("/products/:id/publish")
  async publish(@Req() req: Request, @Param("id") id: string) {
    const tenantId = (req as any).tenantId as string;
    return this.service.publishProduct(tenantId, id);
  }
}
