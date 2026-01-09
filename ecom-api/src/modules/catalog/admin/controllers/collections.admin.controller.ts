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
} from "@nestjs/common";
import { Request } from "express";

import {
  AdminCreateCollectionDto,
  AdminListCollectionsQueryDto,
  AdminUpdateCollectionDto,
} from "@/modules/catalog/admin/dto/admin.collection.dto";
import { CollectionsAdminService } from "@/modules/catalog/admin/services/collections.admin.service";

// Senin projede tenantId alma standardın neyse onu kullan.
// Ben mevcut util’e referans verdim.
import { getTenantIdOrThrow } from "@/modules/catalog/common/tenant/tenant.util";

@Controller("/admin/collections")
export class CollectionsAdminController {
  constructor(private readonly service: CollectionsAdminService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: AdminCreateCollectionDto) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.create(tenantId, dto);
  }

  @Get()
  async list(@Req() req: Request, @Query() q: AdminListCollectionsQueryDto) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.list(tenantId, q);
  }

  @Get(":id")
  async getById(@Req() req: Request, @Param("id") id: string) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.getById(tenantId, id);
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateCollectionDto
  ) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.update(tenantId, id, dto);
  }

  @Delete(":id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.delete(tenantId, id);
  }
}
