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
  Delete,
} from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";
import { CatalogAdminService } from "@/modules/catalog/admin/services/catalog.admin.service";

import {
  AdminAttachProductMediaDto,
  AdminUpdateProductMediaDto,
  AdminReorderProductMediaDto,
} from "@/modules/catalog/admin/dto/admin.product.media.dto";

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

import {
  AdminCreateVariantDto,
  AdminVariantUpdateDto,
} from "@/modules/catalog/admin/dto/admin-variant.dto";

import {
  AdminCreateOptionDto,
  AdminAddOptionValueDto,
} from "@/modules/catalog/admin/dto/admin-option.dto";

@Controller("/admin")
@UseGuards(AdminAuthGuard, TenantHeaderGuard)
export class CatalogAdminController {
  constructor(private readonly service: CatalogAdminService) {}

  // -------------------------
  // Categories (write)
  // -------------------------
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

  @Delete("/categories/:id")
  async deleteCategory(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.adminDeleteCategory(tenantId, id);
  }

  // -------------------------
  // Products (write)
  // -------------------------
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

  @Post("/products/:id/unpublish")
  async unpublishProduct(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.unpublishProduct(tenantId, id);
  }

  @Delete("/products/:id")
  async deleteProduct(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.deleteProduct(tenantId, id);
  }

  // -------------------------
  // Variants (write)
  // -------------------------
  @Post("/products/:id/variants")
  async createVariant(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminCreateVariantDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.createVariant(tenantId, productId, dto);
  }
  @Get("/variants/:id")
  async getVariantDetail(@Req() req: Request, @Param("id") id: string) {
    return this.service.getVariantDetail(req, id);
  }

  @Patch("/variants/:id")
  async updateVariant(
    @Req() req: Request,
    @Param("id") variantId: string,
    @Body() dto: AdminVariantUpdateDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.updateVariant(tenantId, variantId, dto);
  }

  @Delete("/variants/:id")
  async deleteVariant(@Req() req: Request, @Param("id") variantId: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.deleteVariant(tenantId, variantId);
  }

  // -------------------------
  // Options (write)
  // -------------------------
  @Post("/products/:id/options")
  async createOption(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminCreateOptionDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.createOption(tenantId, productId, dto);
  }

  @Post("/options/:id/values")
  async addOptionValue(
    @Req() req: Request,
    @Param("id") optionId: string,
    @Body() dto: AdminAddOptionValueDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.addOptionValue(tenantId, optionId, dto);
  }

  @Delete("/options/:id")
  async deleteOption(@Req() req: Request, @Param("id") optionId: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.deleteOption(tenantId, optionId);
  }

  @Delete("/option-values/:id")
  async deleteOptionValue(
    @Req() req: Request,
    @Param("id") optionValueId: string
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.deleteOptionValue(tenantId, optionValueId);
  }

  // -------------------------
  // READ (Commit A)
  // -------------------------
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

  // -------------------------
  // Product Media (write/read)
  // -------------------------
  @Get("/products/:id/media")
  async listProductMedia(@Req() req: Request, @Param("id") productId: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.listProductMedia(tenantId, productId);
  }

  /**
   * Ürüne media attach
   * - role default: GALLERY
   * - HERO/THUMBNAIL: replace semantics
   */
  @Post("/products/:id/media")
  async attachProductMedia(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminAttachProductMediaDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.attachProductMedia(tenantId, productId, dto);
  }

  /**
   * Ürün medyası delete
   */
  @Delete("/products/:productId/media/:mediaId")
  async deleteProductMedia(
    @Req() req: Request,
    @Param("productId") productId: string,
    @Param("mediaId") mediaId: string
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.deleteProductMedia(tenantId, productId, mediaId);
  }

  /**
   * GALLERY reorder
   * Body: { orderedIds: string[] }
   */
  @Post("/products/:id/media/reorder")
  async reorderProductMedia(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminReorderProductMediaDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.reorderProductMedia(tenantId, productId, dto);
  }
  /**
   * Ürün medyası update
   * - role değişiyorsa singleton roller için replace semantics devrede
   */
  @Patch("/products/:productId/media/:mediaId")
  async updateProductMedia(
    @Req() req: Request,
    @Param("productId") productId: string,
    @Param("mediaId") mediaId: string,
    @Body() dto: AdminUpdateProductMediaDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.updateProductMedia(tenantId, productId, mediaId, dto);
  }
}
