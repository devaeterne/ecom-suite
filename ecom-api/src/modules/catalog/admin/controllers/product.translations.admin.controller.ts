import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { ProductTranslationsAdminService } from "@/modules/catalog/admin/services/product.translations.admin.service";
import {
  AdminCreateProductTranslationDto,
  AdminUpdateProductTranslationDto,
} from "@/modules/catalog/admin/dto/admin.product.translation.dto";

function tenant(req: Request) {
  return requireTenantId(req as any);
}

@Controller("/admin/products")
@UseGuards(AdminAuthGuard, TenantGuard)
export class ProductTranslationsAdminController {
  constructor(private readonly service: ProductTranslationsAdminService) {}

  @Get("/:id/translations")
  async list(@Req() req: Request, @Param("id") productId: string) {
    const tenantId = tenant(req);
    return this.service.list(tenantId, productId);
  }

  @Post("/:id/translations")
  async create(
    @Req() req: Request,
    @Param("id") productId: string,
    @Body() dto: AdminCreateProductTranslationDto,
  ) {
    const tenantId = tenant(req);
    return this.service.create(tenantId, productId, dto);
  }

  @Patch("/:id/translations/:localeCode")
  async update(
    @Req() req: Request,
    @Param("id") productId: string,
    @Param("localeCode") localeCode: string,
    @Body() dto: AdminUpdateProductTranslationDto,
  ) {
    const tenantId = tenant(req);
    return this.service.update(tenantId, productId, localeCode, dto);
  }

  @Delete("/:id/translations/:localeCode")
  async remove(
    @Req() req: Request,
    @Param("id") productId: string,
    @Param("localeCode") localeCode: string,
  ) {
    const tenantId = tenant(req);
    return this.service.delete(tenantId, productId, localeCode);
  }
}
