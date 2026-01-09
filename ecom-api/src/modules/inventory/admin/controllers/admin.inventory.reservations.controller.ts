import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import { InventoryTenancyPolicy } from "../../common/policies/inventory.tenancy";
import { AdminInventoryService } from "../services/inventory.service";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";
import { AdminInventoryReservationsQueryDto } from "../dto/admin.inventory.reservations.query.dto";

@UseGuards(AdminAuthGuard, TenantHeaderGuard)
@Controller("/admin/inventory/reservations")
export class AdminInventoryReservationsController {
  constructor(
    private readonly tenancy: InventoryTenancyPolicy,
    private readonly service: AdminInventoryService
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query() query: AdminInventoryReservationsQueryDto
  ) {
    const { tenantId } = this.tenancy.getScope(req);

    const reservations = await this.service.listReservations({
      tenantId,
      locationId: query.locationId,
      variantId: query.variantId,
      checkoutId: query.checkoutId,
      status: query.status,
      take: query.take,
      skip: query.skip,
    });

    return { reservations };
  }
}
