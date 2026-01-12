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
import { ApiCookieAuth, ApiHeader, ApiTags } from "@nestjs/swagger";

import { InventoryTenancyPolicy } from "../../common/policies/inventory.tenancy";
import { AdminInventoryService } from "../services/inventory.service";
import { UpsertInventoryLevelsDto } from "../dto/upsert.levels.dto";
import { AdminInventoryLevelsQueryDto } from "../dto/admin.inventory.levels.query.dto";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { ApiTenantHeader } from "@/infrastructure/swagger/tenant.swagger";

@ApiTags("AdminInventoryLevels")
@ApiCookieAuth("adminAccessCookie")
@ApiHeader({
  name: "x-tenant-code",
  required: true,
  description: "Tenant code header (required by TenantHeaderGuard)",
})
@ApiTenantHeader()
@UseGuards(AdminAuthGuard, TenantHeaderGuard)
@Controller("/admin/inventory/levels")
export class AdminInventoryLevelsController {
  constructor(
    private readonly tenancy: InventoryTenancyPolicy,
    private readonly service: AdminInventoryService
  ) {}

  /**
   * List inventory levels (optionally filtered)
   *
   * Query params:
   * - locationId?
   * - variantId?
   * - take?
   * - skip?
   */
  @Get()
  async list(
    @Req() req: Request,
    @Query() query: AdminInventoryLevelsQueryDto
  ) {
    const { tenantId } = this.tenancy.getScope(req);

    const levels = await this.service.listLevels({
      tenantId,
      locationId: query.locationId,
      variantId: query.variantId,
      take: query.take,
      skip: query.skip,
    });

    return { levels };
  }

  /**
   * Upsert inventory levels
   *
   * Body:
   * {
   *   items: [
   *     { locationId, variantId, stockedQuantity }
   *   ]
   * }
   */
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
