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
import {
  TenantGuard,
  TenantHeaderGuard,
} from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import { CategoryTranslationsAdminService } from "@/modules/catalog/admin/services/category.translations.admin.service";
import {
  AdminCreateCategoryTranslationDto,
  AdminUpdateCategoryTranslationDto,
} from "@/modules/catalog/admin/dto/admin.category.translations.dto";

function tenant(req: Request) {
  return requireTenantId(req as any);
}

@Controller("/admin/categories")
@UseGuards(AdminAuthGuard, TenantGuard, TenantHeaderGuard)
export class CategoryTranslationsAdminController {
  constructor(private readonly service: CategoryTranslationsAdminService) {}

  @Get("/:id/translations")
  async list(@Req() req: Request, @Param("id") categoryId: string) {
    const tenantId = tenant(req);
    return this.service.list(tenantId, categoryId);
  }

  @Post("/:id/translations")
  async create(
    @Req() req: Request,
    @Param("id") categoryId: string,
    @Body() dto: AdminCreateCategoryTranslationDto,
  ) {
    const tenantId = tenant(req);
    return this.service.create(tenantId, categoryId, dto);
  }

  @Patch("/:id/translations/:localeCode")
  async update(
    @Req() req: Request,
    @Param("id") categoryId: string,
    @Param("localeCode") localeCode: string,
    @Body() dto: AdminUpdateCategoryTranslationDto,
  ) {
    const tenantId = tenant(req);
    return this.service.update(tenantId, categoryId, localeCode, dto);
  }

  @Delete("/:id/translations/:localeCode")
  async remove(
    @Req() req: Request,
    @Param("id") categoryId: string,
    @Param("localeCode") localeCode: string,
  ) {
    const tenantId = tenant(req);
    return this.service.delete(tenantId, categoryId, localeCode);
  }
}
