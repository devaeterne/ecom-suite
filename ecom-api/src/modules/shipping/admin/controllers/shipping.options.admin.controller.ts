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
  UnauthorizedException,
} from "@nestjs/common";

import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { AdminAuthContext } from "@/modules/auth/admin/common/types/admin-request";

import { ShippingOptionsAdminService } from "../services/shipping.options.admin.service";
import {
  AdminCreateShippingOptionDto,
  AdminPatchShippingOptionDto,
} from "../dto/admin.shipping-option.dto";

@Controller()
export class ShippingOptionsAdminController {
  constructor(private readonly service: ShippingOptionsAdminService) {}

  private tenantId(req: AdminAuthContext) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");
    return tenantId;
  }

  @UseGuards(AdminAccessGuard)
  @Get("/admin/shipping/options")
  list(@Req() req: AdminAuthContext, @Query("profileId") profileId?: string) {
    return this.service.list({
      tenantId: this.tenantId(req),
      profileId,
    });
  }

  @UseGuards(AdminAccessGuard)
  @Post("/admin/shipping/profiles/:profileId/options")
  create(
    @Req() req: AdminAuthContext,
    @Param("profileId") profileId: string,
    @Body() dto: AdminCreateShippingOptionDto
  ) {
    return this.service.create({
      tenantId: this.tenantId(req),
      profileId,
      dto,
    });
  }

  @UseGuards(AdminAccessGuard)
  @Patch("/admin/shipping/options/:id")
  patch(
    @Req() req: AdminAuthContext,
    @Param("id") id: string,
    @Body() dto: AdminPatchShippingOptionDto
  ) {
    return this.service.patch({
      tenantId: this.tenantId(req),
      id,
      dto,
    });
  }

  @UseGuards(AdminAccessGuard)
  @Delete("/admin/shipping/options/:id")
  remove(@Req() req: AdminAuthContext, @Param("id") id: string) {
    return this.service.remove(this.tenantId(req), id);
  }
}
