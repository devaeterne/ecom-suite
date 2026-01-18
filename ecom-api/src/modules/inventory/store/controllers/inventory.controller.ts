import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";
import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";

import { StoreInventoryService } from "@/modules/inventory/store/services/inventory.service";
import { ReserveStockDto, ReleaseStockDto } from "../dto/inventory.dto";

function requireTenantId(req: StoreAuthContext) {
  if (!req.tenantId) throw new UnauthorizedException("Tenant context missing");
  return req.tenantId;
}

@UseGuards(StoreAccessGuard)
@Controller("/store/checkouts")
export class StoreInventoryController {
  constructor(private readonly inventory: StoreInventoryService) {}

  @Post("/:id/reserve-stock")
  async reserve(
    @Req() req: StoreAuthContext,
    @Param("id") checkoutId: string,
    @Body() dto: ReserveStockDto,
  ) {
    const tenantId = requireTenantId(req);
    const _customerId = req.customerId; // opsiyonel: audit

    return this.inventory.reserveForCheckout(tenantId, checkoutId, {
      locationId: dto.locationId,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Post("/:id/release-stock")
  async release(
    @Req() req: StoreAuthContext,
    @Param("id") checkoutId: string,
    @Body() dto: ReleaseStockDto,
  ) {
    const tenantId = requireTenantId(req);
    const _customerId = req.customerId;

    return this.inventory.releaseForCheckout(tenantId, checkoutId, {
      locationId: dto.locationId,
    });
  }

  @Get("/:id/stock-status")
  async stockStatus(
    @Req() req: StoreAuthContext,
    @Param("id") checkoutId: string,
    @Query("locationId") locationId?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.inventory.getStockStatus(tenantId, checkoutId, { locationId });
  }
}
