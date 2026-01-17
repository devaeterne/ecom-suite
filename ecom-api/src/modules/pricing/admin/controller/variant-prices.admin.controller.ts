import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Patch,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";

import { PricingAdminService } from "../services/pricing.admin.service";
import {
  CreateVariantPriceDto,
  UpdateVariantPriceDto,
} from "../dto/variant-price.dto";
import { AdminAccessGuard } from "@/modules/auth/admin/admin/guards/admin-access.guard";
@ApiTags("Admin Pricing")
@ApiCookieAuth("adminAccessCookie")
@UseGuards(AdminAccessGuard)
@Controller("admin/variants/:variantId/prices")
export class VariantPricesAdminController {
  constructor(private readonly service: PricingAdminService) {}

  @Post()
  create(
    @Param("variantId") variantId: string,
    @Body() dto: CreateVariantPriceDto,
    @Req() req: any,
  ) {
    return this.service.addVariantPrice(req.user.tenantId, variantId, dto);
  }

  @Get()
  list(@Param("variantId") variantId: string, @Req() req: any) {
    return this.service.listVariantPrices(req.user.tenantId, variantId);
  }

  @Patch(":priceId")
  update(
    @Param("variantId") variantId: string,
    @Param("priceId") priceId: string,
    @Body() dto: UpdateVariantPriceDto,
    @Req() req: any,
  ) {
    return this.service.updateVariantPrice(
      req.user.tenantId,
      variantId,
      priceId,
      dto,
    );
  }

  @Delete(":priceId")
  remove(
    @Param("variantId") variantId: string,
    @Param("priceId") priceId: string,
    @Req() req: any,
  ) {
    return this.service.removeVariantPrice(
      req.user.tenantId,
      variantId,
      priceId,
    );
  }
}
