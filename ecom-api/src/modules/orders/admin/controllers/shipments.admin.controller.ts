import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { AdminAuthContext } from "@/modules/auth/admin/common/types/admin-request";

import { ShipmentsAdminService } from "../services/shipments.admin.service";
import { CreateShipmentDto } from "../dto/create-shipment.dto";
import { CreateShipmentEventDto } from "../dto/create-shipment-event.dto";
import { MarkShipmentDeliveredDto } from "../dto/mark-shipment-delivered.dto";
import { AdminAuthGuard } from "@/infrastructure";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";

@ApiTags("FullfilmentsAdmin")
@ApiCookieAuth("adminAccessCookie")
@UseGuards(AdminAuthGuard, TenantGuard)
@Controller("/admin")
export class ShipmentsAdminController {
  constructor(private readonly service: ShipmentsAdminService) {}

  private tenantId(req: AdminAuthContext) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");
    return tenantId;
  }

  @UseGuards(AdminAccessGuard)
  @Get("/fulfillments/:fulfillmentId/shipments")
  list(
    @Req() req: AdminAuthContext,
    @Param("fulfillmentId") fulfillmentId: string,
  ) {
    return this.service.list({ tenantId: this.tenantId(req), fulfillmentId });
  }

  @UseGuards(AdminAccessGuard)
  @Post("/fulfillments/:fulfillmentId/shipments")
  create(
    @Req() req: AdminAuthContext,
    @Param("fulfillmentId") fulfillmentId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.service.create({
      tenantId: this.tenantId(req),
      fulfillmentId,
      carrierId: dto.carrierId,
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
      labelUrl: dto.labelUrl,
      providerShipmentId: dto.providerShipmentId,
      metadata: dto.metadata,
    });
  }

  @UseGuards(AdminAccessGuard)
  @Post("/shipments/:shipmentId/events")
  addEvent(
    @Req() req: AdminAuthContext,
    @Param("shipmentId") shipmentId: string,
    @Body() dto: CreateShipmentEventDto,
  ) {
    return this.service.addEvent({
      tenantId: this.tenantId(req),
      shipmentId,
      type: dto.type,
      status: dto.status,
      message: dto.message,
      location: dto.location,
      raw: dto.raw,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
    });
  }

  @UseGuards(AdminAccessGuard)
  @Post("/shipments/:shipmentId/mark-delivered")
  markDelivered(
    @Req() req: AdminAuthContext,
    @Param("shipmentId") shipmentId: string,
    @Body() _dto: MarkShipmentDeliveredDto,
  ) {
    return this.service.markDelivered({
      tenantId: this.tenantId(req),
      shipmentId,
    });
  }
}
