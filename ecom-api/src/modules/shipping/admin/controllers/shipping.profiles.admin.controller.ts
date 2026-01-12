import {
  Body,
  Controller,
  Delete,
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

import { ShippingProfilesAdminService } from "../services/shipping.profiles.admin.service";
import {
  AdminCreateShippingProfileDto,
  AdminPatchShippingProfileDto,
} from "../dto/admin.shipping-profile.dto";

@Controller("/admin/shipping/profiles")
export class ShippingProfilesAdminController {
  constructor(private readonly service: ShippingProfilesAdminService) {}

  private tenantId(req: AdminAuthContext) {
    const tenantId = req.tenantId ?? req.tenant?.id ?? req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");
    return tenantId;
  }

  @UseGuards(AdminAccessGuard)
  @Get()
  list(@Req() req: AdminAuthContext) {
    return this.service.list(this.tenantId(req));
  }

  @UseGuards(AdminAccessGuard)
  @Post()
  create(
    @Req() req: AdminAuthContext,
    @Body() dto: AdminCreateShippingProfileDto
  ) {
    return this.service.create(this.tenantId(req), dto);
  }

  @UseGuards(AdminAccessGuard)
  @Patch(":id")
  patch(
    @Req() req: AdminAuthContext,
    @Param("id") id: string,
    @Body() dto: AdminPatchShippingProfileDto
  ) {
    return this.service.patch(this.tenantId(req), id, dto);
  }

  @UseGuards(AdminAccessGuard)
  @Delete(":id")
  remove(@Req() req: AdminAuthContext, @Param("id") id: string) {
    return this.service.remove(this.tenantId(req), id);
  }
}
