import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";

import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { AdminAuthContext } from "@/modules/auth/admin/common/types/admin-request";

import { FullfillmentsAdminService } from "../services/fullfillments.admin.service";
import { CreateFullfilmentDto } from "../dto/create-fullfilment.dto";

@Controller("/api/admin")
export class FullfilmentsAdminController {
  constructor(private readonly service: FullfillmentsAdminService) {}

  private tenantId(req: AdminAuthContext) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");
    return tenantId;
  }

  @UseGuards(AdminAccessGuard)
  @Get("/orders/:orderId/fulfillments")
  list(@Req() req: AdminAuthContext, @Param("orderId") orderId: string) {
    return this.service.list({ tenantId: this.tenantId(req), orderId });
  }

  @UseGuards(AdminAccessGuard)
  @Post("/orders/:orderId/fulfillments")
  create(
    @Req() req: AdminAuthContext,
    @Param("orderId") orderId: string,
    @Body() dto: CreateFullfilmentDto
  ) {
    return this.service.create({
      tenantId: this.tenantId(req),
      orderId,
      carrierId: dto.carrierId,
      trackingNo: dto.trackingNo,
      status: dto.status,
      metadata: dto.metadata,
    });
  }

  @UseGuards(AdminAccessGuard)
  @Patch("/fulfillments/:id")
  patch(
    @Req() req: AdminAuthContext,
    @Param("id") id: string,
    @Body() dto: any
  ) {
    return this.service.patch({
      tenantId: this.tenantId(req),
      id,
      status: dto.status,
      carrierId: dto.carrierId,
      trackingNo: dto.trackingNo,
      metadata: dto.metadata,
    });
  }
}
