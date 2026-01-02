import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { CatalogAdminService } from "@/modules/catalog/admin/service/catalog.admin.service";
import {
  AdminCreateCategoryDto,
  AdminUpdateCategoryDto,
} from "@/modules/catalog/admin/dto/admin-category.dto";
import {
  AdminCreateProductDto,
  AdminUpdateProductDto,
} from "@/modules/catalog/admin/dto/admin-product.dto";

/**
 * ✅ Admin controller için tenantId kaynağı:
 * - Öncelik: AdminAuthGuard -> req.tenant.id (UUID)
 * - Fallback: TenantHeaderGuard -> req.tenantId (UUID)
 * - Header util (getTenantHeaderValue) burada KULLANILMAZ (ham "acme" gelebilir)
 */
function requireTenantId(req: any): string {
  const tenantId =
    req?.tenant?.id ??
    req?.tenantId ?? // bazı akışlarda bu alan set ediliyor olabilir
    req?.user?.tenantId; // en son fallback (payload)

  if (!tenantId || typeof tenantId !== "string") {
    throw new BadRequestException("Tenant context missing");
  }

  return tenantId;
}

@Controller("/admin")
@UseGuards(AdminAuthGuard)
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
  async publish(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.publishProduct(tenantId, id);
  }
}
