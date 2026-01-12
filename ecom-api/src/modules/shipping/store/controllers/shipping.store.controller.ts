import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from "@nestjs/common";

import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import { StoreRequest } from "@/modules/auth/store/common/types/store-request";

import { ShippingStoreService } from "../services/shipping.store.service";
import { ListShippingOptionsQueryDto } from "../dto/list-shipping-options.query.dto";

@Controller("/store/shipping-options")
export class ShippingStoreController {
  constructor(private readonly service: ShippingStoreService) {}

  @UseGuards(StoreAccessGuard)
  @Get()
  async list(
    @Req() req: StoreRequest,
    @Query() query: ListShippingOptionsQueryDto
  ) {
    const tenantId = req.tenantId ?? (req as any).tenant?.id;
    if (!tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");

    return this.service.listOptions({
      tenantId,
      profileId: query.profileId,
      provider: query.provider,
    });
  }
}
