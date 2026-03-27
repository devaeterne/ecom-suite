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
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

import {
  AdminCreateTagDto,
  AdminUpdateTagDto,
  AdminListTagsQueryDto,
} from "@/modules/catalog/admin/dto/admin.product.tag.dto";

import { TagsAdminService } from "@/modules/catalog/admin/services/tags.admin.service";

function tenant(req: Request) {
  return requireTenantId(req as any);
}

@Controller("/admin/tags")
@UseGuards(AdminAuthGuard, TenantGuard)
export class TagsAdminController {
  constructor(private readonly service: TagsAdminService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: AdminCreateTagDto) {
    const tenantId = tenant(req);
    return this.service.create(tenantId, dto);
  }

  @Get()
  async list(@Req() req: Request, @Query() q: AdminListTagsQueryDto) {
    const tenantId = tenant(req);
    return this.service.list(tenantId, q);
  }

  @Get("/:id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const tenantId = tenant(req);
    return this.service.getById(tenantId, id);
  }

  @Patch("/:id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AdminUpdateTagDto,
  ) {
    const tenantId = tenant(req);
    return this.service.update(tenantId, id, dto);
  }

  @Delete("/:id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const tenantId = tenant(req);
    return this.service.delete(tenantId, id);
  }
}
