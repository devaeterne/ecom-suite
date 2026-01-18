import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from "@nestjs/common";

import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import type { StoreRequest } from "@/modules/auth/store/common/types/store-request";

import { ShippingStoreService } from "../services/shipping.store.service";
import { ListShippingOptionsQueryDto } from "../dto/list-shipping-options.query.dto";

function requireTenant(req: StoreRequest) {
  if (!req.tenantId) throw new UnauthorizedException("TENANT_ID_MISSING");
  return req.tenantId;
}

@UseGuards(StoreAccessGuard)
@Controller("/store/shipping-options")
export class ShippingStoreController {
  constructor(private readonly service: ShippingStoreService) {}

  @Get()
  async list(
    @Req() req: StoreRequest,
    @Query() query: ListShippingOptionsQueryDto,
  ) {
    const tenantId = requireTenant(req);

    return this.service.listOptions({
      tenantId,
      profileId: query.profileId,
      provider: query.provider,
    });
  }
}
