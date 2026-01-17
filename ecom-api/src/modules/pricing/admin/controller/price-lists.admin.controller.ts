import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
import { PriceListsAdminService } from "../services/price-list.admin.service";
import { CreatePriceListDto, UpdatePriceListDto } from "../dto/price-list.dto";

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

  @Patch(":id")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdatePriceListDto,
  ) {
    const priceList = await this.service.update(req.user.tenantId, id, body);
    return { priceList };
  }

  @Delete(":id")
  async remove(@Req() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
