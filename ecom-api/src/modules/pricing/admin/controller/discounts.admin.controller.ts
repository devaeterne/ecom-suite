import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { DiscountsAdminService } from "../services/discounts.admin.service";
import { CreateDiscountDto } from "../dto/discount.dto";

@ApiTags("Admin Discounts")
@ApiCookieAuth("adminAccessCookie")
@UseGuards(AdminAccessGuard)
@Controller("admin/discounts")
export class DiscountsAdminController {
  constructor(private readonly service: DiscountsAdminService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateDiscountDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }
}
