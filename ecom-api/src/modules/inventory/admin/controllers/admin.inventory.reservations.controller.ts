import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import { InventoryTenancyPolicy } from "../../common/policies/inventory.tenancy";
import { AdminInventoryService } from "../services/inventory.service";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";

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
    @Query("locationId") locationId?: string,
    @Query("variantId") variantId?: string,
    @Query("checkoutId") checkoutId?: string,
    @Query("status") status?: "ACTIVE" | "COMPLETED" | "CANCELED" | "EXPIRED",
    @Query("take") take?: string,
    @Query("skip") skip?: string
  ) {
    const { tenantId } = this.tenancy.getScope(req);

    const reservations = await this.service.listReservations({
      tenantId,
      locationId,
      variantId,
      checkoutId,
      status,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });

    return { reservations };
  }
}
