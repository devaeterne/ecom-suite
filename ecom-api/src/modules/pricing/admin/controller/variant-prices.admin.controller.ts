import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { PricingAdminService } from "../services/pricing.admin.service";
import { CreateVariantPriceDto } from "../dto/variant-price.dto";
import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";

@ApiTags("Admin Pricing")
@ApiCookieAuth("admin_access")
@UseGuards(AdminAccessGuard)
@Controller("admin/variants/:variantId/prices")
export class VariantPricesAdminController {
  constructor(private readonly service: PricingAdminService) {}

  @Post()
  async create(
    @Param("variantId") variantId: string,
    @Body() dto: CreateVariantPriceDto,
    @Req() req: any
  ) {
    const tenantId = req.user.tenantId;

    const price = await this.service.addVariantPrice(tenantId, variantId, dto);

    return { price };
  }

  @Get()
  async list(@Param("variantId") variantId: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    const items = await this.service.listVariantPrices(tenantId, variantId);
    return { items };
  }
}
