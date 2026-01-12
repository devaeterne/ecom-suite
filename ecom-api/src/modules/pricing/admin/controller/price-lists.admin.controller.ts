import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { PriceListsAdminService } from "../services/price-list.admin.service";
import { CreatePriceListDto } from "../dto/price-list.dto";

@ApiTags("Admin Price Lists")
@ApiCookieAuth("adminAccessCookie")
@UseGuards(AdminAccessGuard)
@Controller("admin/price-lists")
export class PriceListsAdminController {
  constructor(private readonly service: PriceListsAdminService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreatePriceListDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.tenantId);
  }

  @Patch(":id/activate")
  activate(@Req() req: any, @Param("id") id: string) {
    return this.service.activate(req.user.tenantId, id);
  }

  @Patch(":id/deactivate")
  deactivate(@Req() req: any, @Param("id") id: string) {
    return this.service.deactivate(req.user.tenantId, id);
  }
}
