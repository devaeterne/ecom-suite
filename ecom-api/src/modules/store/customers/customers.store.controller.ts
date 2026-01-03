// src/modules/store/customers/customers.store.controller.ts
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
import { CustomersStoreService } from "./customers.store.service";
import { UpdateCustomerDto } from "@/modules/store/customers/dto/update-customer.dto";
import { UpsertAddressDto } from "@/modules/store/customers/dto//upsert-address.dto";
import { StoreAccessGuard } from "@/modules/auth/store/guards/store-access.guard";

@UseGuards(StoreAccessGuard)
@Controller("store/customers")
export class CustomersStoreController {
  constructor(private readonly svc: CustomersStoreService) {}

  @Get("me")
  async me(@Req() req: any) {
    return this.svc.getMe(req);
  }

  @Patch("me")
  async updateMe(@Req() req: any, @Body() dto: UpdateCustomerDto) {
    return this.svc.updateMe(req, dto);
  }

  @Get("me/addresses")
  async listAddresses(@Req() req: any) {
    return this.svc.listAddresses(req);
  }

  @Post("me/addresses")
  async createAddress(@Req() req: any, @Body() dto: UpsertAddressDto) {
    return this.svc.createAddress(req, dto);
  }

  @Patch("me/addresses/:id")
  async updateAddress(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpsertAddressDto
  ) {
    return this.svc.updateAddress(req, id, dto);
  }

  @Delete("me/addresses/:id")
  async deleteAddress(@Req() req: any, @Param("id") id: string) {
    return this.svc.deleteAddress(req, id);
  }
}
