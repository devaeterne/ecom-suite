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
import { Request } from "express";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import {
  AdminCreateCollectionDto,
  AdminUpdateCollectionDto,
  AdminListCollectionsQueryDto,
} from "@/modules/catalog/admin/dto/admin.collection.dto";

import { CollectionsAdminService } from "@/modules/catalog/admin/services/collections.admin.service";

@Controller("/admin/collections")
@UseGuards(AdminAuthGuard, TenantHeaderGuard)
export class CollectionsAdminController {
  constructor(private readonly service: CollectionsAdminService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: AdminCreateCollectionDto) {
    const tenantId = requireTenantId(req as any);
    return this.service.create(tenantId, dto);
  }

  @Get()
  async list(@Req() req: Request, @Query() q: AdminListCollectionsQueryDto) {
    const tenantId = requireTenantId(req as any);
    return this.service.list(tenantId, q);
  }

  @Get("/:id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.getById(tenantId, id);
  }

  @Patch("/:id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateCollectionDto
  ) {
    const tenantId = requireTenantId(req as any);
    return this.service.update(tenantId, id, dto);
  }

  @Delete("/:id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const tenantId = requireTenantId(req as any);
    return this.service.delete(tenantId, id);
  }
}
