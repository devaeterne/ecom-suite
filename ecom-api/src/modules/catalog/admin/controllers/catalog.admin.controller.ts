// src/modules/catalog/admin/controllers/catalog-admin.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";
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

type AppRequest = FastifyRequest & { user?: any };

function tenantIdFrom(req: AppRequest): string {
  return requireTenantId(req as any);
}

function parseOptionalBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return undefined;
}

@ApiTags("Catalog (Admin)")
@ApiCookieAuth("adminAccessCookie")
@Controller("admin")
@UseGuards(AdminAuthGuard, TenantGuard)
export class CatalogAdminController {
  constructor(private readonly service: CatalogAdminService) {}

  // -------------------------
  // Categories
  // -------------------------
  @Post("categories")
  async createCategory(
    @Req() req: AppRequest,
    @Body() dto: AdminCreateCategoryDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.createCategory(tenantId, dto);
  }

  @Patch("categories/:id")
  async updateCategory(
    @Req() req: AppRequest,
    @Param("id") id: string,
    @Body() dto: AdminUpdateCategoryDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.updateCategory(tenantId, id, dto);
  }

  @Delete("categories/:id")
  async deleteCategory(@Req() req: AppRequest, @Param("id") id: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.adminDeleteCategory(tenantId, id);
  }

  @Get("categories")
  async listCategories(
    @Req() req: AppRequest,
    @Query() q: AdminCategoryListQueryDto,
    @Query("isActive") isActiveRaw?: string, // 👈 string gelir
  ) {
    const tenantId = tenantIdFrom(req);
    const isActive = parseOptionalBool(isActiveRaw);

    console.log(
      "[LIST] q =",
      q,
      "isActiveRaw =",
      isActiveRaw,
      "parsed =",
      isActive,
    );

    return this.service.listCategories(tenantId, {
      view: q?.view,
      q: q?.q,
      isActive,
    });
  }

  @Get("categories/:id")
  async getCategory(@Req() req: AppRequest, @Param("id") id: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.getCategory(tenantId, id);
  }

  // -------------------------
  // Products
  // -------------------------
  @Post("products")
  async createProduct(
    @Req() req: AppRequest,
    @Body() dto: AdminCreateProductDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.createProduct(tenantId, dto);
  }

  @Patch("products/:id")
  async updateProduct(
    @Req() req: AppRequest,
    @Param("id") id: string,
    @Body() dto: AdminUpdateProductDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.updateProduct(tenantId, id, dto);
  }

  @Post("products/:id/publish")
  async publishProduct(@Req() req: AppRequest, @Param("id") id: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.publishProduct(tenantId, id);
  }

  @Post("products/:id/unpublish")
  async unpublishProduct(@Req() req: AppRequest, @Param("id") id: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.unpublishProduct(tenantId, id);
  }

  @Delete("products/:id")
  async deleteProduct(@Req() req: AppRequest, @Param("id") id: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.deleteProduct(tenantId, id);
  }

  @Get("products")
  async listProducts(
    @Req() req: AppRequest,
    @Query() q: AdminProductListQueryDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.listProducts(tenantId, q);
  }

  @Get("products/:id")
  async getProduct(@Req() req: AppRequest, @Param("id") id: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.getProduct(tenantId, id);
  }

  @Get("products/:id/variants")
  async listProductVariants(
    @Req() req: AppRequest,
    @Param("id") productId: string,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.listVariantsByProduct(tenantId, productId);
  }

  // -------------------------
  // Variants
  // -------------------------
  @Post("products/:id/variants")
  async createVariant(
    @Req() req: AppRequest,
    @Param("id") productId: string,
    @Body() dto: AdminCreateVariantDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.createVariant(tenantId, productId, dto);
  }

  @Get("variants/:id")
  async getVariantDetail(
    @Req() req: AppRequest,
    @Param("id") variantId: string,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.getVariantDetail(tenantId, variantId);
  }

  @Patch("variants/:id")
  async updateVariant(
    @Req() req: AppRequest,
    @Param("id") variantId: string,
    @Body() dto: AdminVariantUpdateDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.updateVariant(tenantId, variantId, dto);
  }

  @Delete("variants/:id")
  async deleteVariant(@Req() req: AppRequest, @Param("id") variantId: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.deleteVariant(tenantId, variantId);
  }

  // -------------------------
  // Options
  // -------------------------
  @Post("products/:id/options")
  async createOption(
    @Req() req: AppRequest,
    @Param("id") productId: string,
    @Body() dto: AdminCreateOptionDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.createOption(tenantId, productId, dto);
  }

  @Post("options/:id/values")
  async addOptionValue(
    @Req() req: AppRequest,
    @Param("id") optionId: string,
    @Body() dto: AdminAddOptionValueDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.addOptionValue(tenantId, optionId, dto);
  }

  @Delete("options/:id")
  async deleteOption(@Req() req: AppRequest, @Param("id") optionId: string) {
    const tenantId = tenantIdFrom(req);
    return this.service.deleteOption(tenantId, optionId);
  }

  @Delete("option-values/:id")
  async deleteOptionValue(
    @Req() req: AppRequest,
    @Param("id") optionValueId: string,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.deleteOptionValue(tenantId, optionValueId);
  }

  // -------------------------
  // Product Media
  // -------------------------
  @Get("products/:id/media")
  async listProductMedia(
    @Req() req: AppRequest,
    @Param("id") productId: string,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.listProductMedia(tenantId, productId);
  }

  /**
   * Ürüne media attach
   * - role default: GALLERY
   * - HERO/THUMBNAIL: replace semantics
   */
  @Post("products/:id/media")
  async attachProductMedia(
    @Req() req: AppRequest,
    @Param("id") productId: string,
    @Body() dto: AdminAttachProductMediaDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.attachProductMedia(tenantId, productId, dto);
  }

  /**
   * Ürün medyası delete
   */
  @Delete("products/:productId/media/:mediaId")
  async deleteProductMedia(
    @Req() req: AppRequest,
    @Param("productId") productId: string,
    @Param("mediaId") mediaId: string,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.deleteProductMedia(tenantId, productId, mediaId);
  }

  /**
   * GALLERY reorder
   * Body: { orderedIds: string[] }
   */
  @Post("products/:id/media/reorder")
  async reorderProductMedia(
    @Req() req: AppRequest,
    @Param("id") productId: string,
    @Body() dto: AdminReorderProductMediaDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.reorderProductMedia(tenantId, productId, dto);
  }

  /**
   * Ürün medyası update
   * - role değişiyorsa singleton roller için replace semantics devrede
   */
  @Patch("products/:productId/media/:mediaId")
  async updateProductMedia(
    @Req() req: AppRequest,
    @Param("productId") productId: string,
    @Param("mediaId") mediaId: string,
    @Body() dto: AdminUpdateProductMediaDto,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.updateProductMedia(tenantId, productId, mediaId, dto);
  }

  @Get("products/exists")
  async productHandleExists(
    @Req() req: AppRequest,
    @Query("handle") handle: string,
    @Query("excludeId") excludeId?: string,
  ) {
    const tenantId = tenantIdFrom(req);
    return this.service.productHandleExists(tenantId, handle, excludeId);
  }
}
