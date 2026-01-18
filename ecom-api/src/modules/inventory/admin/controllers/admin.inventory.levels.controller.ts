import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { InventoryTenancyPolicy } from "../../common/policies/inventory.tenancy";
import { AdminInventoryService } from "../services/inventory.service";
import { UpsertInventoryLevelsDto } from "../dto/upsert.levels.dto";
import { AdminInventoryLevelsQueryDto } from "../dto/admin.inventory.levels.query.dto";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { ApiTenantHeader } from "@/infrastructure/swagger/tenant.swagger";

@ApiTags("AdminInventoryLevels")
@ApiCookieAuth("adminAccessCookie")
@ApiTenantHeader()
@UseGuards(AdminAuthGuard, TenantHeaderGuard)
@Controller("/admin/inventory/levels")
export class AdminInventoryLevelsController {
  constructor(
    private readonly tenancy: InventoryTenancyPolicy,
    private readonly service: AdminInventoryService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query() query: AdminInventoryLevelsQueryDto,
  ) {
    const { tenantId } = this.tenancy.getScope(req);

    const take = query.take != null ? Number(query.take) : undefined;
    const skip = query.skip != null ? Number(query.skip) : undefined;

    const levels = await this.service.listLevels({
      tenantId,
      locationId: query.locationId,
      variantId: query.variantId,
      take: Number.isFinite(take as any) ? take : undefined,
      skip: Number.isFinite(skip as any) ? skip : undefined,
    });

    return { levels };
  }

  @Put()
  async upsert(@Req() req: Request, @Body() dto: UpsertInventoryLevelsDto) {
    const { tenantId } = this.tenancy.getScope(req);

    const levels = await this.service.upsertLevels({
      tenantId,
      items: dto.items,
    });

    return { levels };
  }
}
