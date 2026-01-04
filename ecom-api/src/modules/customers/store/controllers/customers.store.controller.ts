// src/modules/customers/store/controllers/customers.store.controller.ts
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
} from "@nestjs/common";

import { CustomersStoreService } from "@/modules/customers/store/services/customers.store.service";
import { UpdateCustomerDto } from "@/modules/customers/store/dto/update-customer.dto";
import { UpsertAddressDto } from "@/modules/customers/store/dto/upsert-address.dto";

import { StoreAccessGuard } from "@/modules/auth/store/store/guards/store-access.guard";
import type { StoreAuthContext } from "@/modules/auth/store/common/types/store-request";

@UseGuards(StoreAccessGuard)
@Controller("store/customers")
export class CustomersStoreController {
  constructor(private readonly svc: CustomersStoreService) {}

  @Get("me")
  me(@Req() req: StoreAuthContext) {
    return this.svc.getMe(req);
  }

  @Patch("me")
  updateMe(@Req() req: StoreAuthContext, @Body() dto: UpdateCustomerDto) {
    return this.svc.updateMe(req, dto);
  }

  @Get("me/addresses")
  listAddresses(@Req() req: StoreAuthContext) {
    return this.svc.listAddresses(req);
  }

  @Post("me/addresses")
  createAddress(@Req() req: StoreAuthContext, @Body() dto: UpsertAddressDto) {
    return this.svc.createAddress(req, dto);
  }

  @Patch("me/addresses/:id")
  updateAddress(
    @Req() req: StoreAuthContext,
    @Param("id") id: string,
    @Body() dto: UpsertAddressDto
  ) {
    return this.svc.updateAddress(req, id, dto);
  }

  @Delete("me/addresses/:id")
  deleteAddress(@Req() req: StoreAuthContext, @Param("id") id: string) {
    return this.svc.deleteAddress(req, id);
  }
}
