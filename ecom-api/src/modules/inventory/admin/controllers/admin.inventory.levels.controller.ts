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

import { InventoryTenancyPolicy } from "../../common/policies/inventory.tenancy";
import { AdminInventoryService } from "../services/inventory.service";
import { UpsertInventoryLevelsDto } from "../dto/upsert.levels.dto";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";

@UseGuards(AdminAuthGuard, TenantHeaderGuard)
@Controller("/admin/inventory/levels")
export class AdminInventoryLevelsController {
  constructor(
    private readonly tenancy: InventoryTenancyPolicy,
    private readonly service: AdminInventoryService
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query("locationId") locationId?: string, //xs
    @Query("variantId") variantId?: string,
    @Query("take") take?: string,
    @Query("skip") skip?: string
  ) {
    const { tenantId } = this.tenancy.getScope(req);
    const levels = await this.service.listLevels({
      tenantId,
      locationId,
      variantId,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
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
