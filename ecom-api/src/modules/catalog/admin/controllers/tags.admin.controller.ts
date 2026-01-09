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
  AdminCreateTagDto,
  AdminListTagsQueryDto,
  AdminUpdateTagDto,
} from "@/modules/catalog/admin/dto/admin.product.tag.dto";
import { TagsAdminService } from "@/modules/catalog/admin/services/tags.admin.service";
import { getTenantIdOrThrow } from "@/modules/catalog/common/tenant/tenant.util";

@Controller("/admin/tags")
export class TagsAdminController {
  constructor(private readonly service: TagsAdminService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: AdminCreateTagDto) {
    const tenantId = getTenantIdOrThrow(req);
    return this.service.create(tenantId, dto);
  }

  @Get()
  async list(@Req() req: Request, @Query() q: AdminListTagsQueryDto) {
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
    @Body() dto: AdminUpdateTagDto
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
