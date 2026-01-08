import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import { InventoryTenancyPolicy } from "../../common/policies/inventory.tenancy";
import { AdminInventoryService } from "../services/inventory.service";
import { CreateInventoryLocationDto } from "../dto/create.location.dto";
import { UpdateInventoryLocationDto } from "../dto/update.location.dto";

import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { TenantHeaderGuard } from "@/modules/catalog/common/tenant/tenant.guard";

@UseGuards(AdminAuthGuard, TenantHeaderGuard)
@Controller("/admin/inventory/locations")
export class AdminInventoryLocationsController {
  constructor(
    private readonly tenancy: InventoryTenancyPolicy,
    private readonly service: AdminInventoryService
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const { tenantId } = this.tenancy.getScope(req);
    const locations = await this.service.listLocations(tenantId);
    return { locations };
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateInventoryLocationDto) {
    const { tenantId } = this.tenancy.getScope(req);
    const location = await this.service.createLocation(tenantId, dto);
    return { location };
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateInventoryLocationDto
  ) {
    const { tenantId } = this.tenancy.getScope(req);
    const location = await this.service.updateLocation(tenantId, id, dto);
    return { location };
  }

  @Post(":id/set-default")
  async setDefault(@Req() req: Request, @Param("id") id: string) {
    const { tenantId } = this.tenancy.getScope(req);
    const location = await this.service.setDefaultLocation(tenantId, id);
    return { location };
  }

  @Delete(":id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const { tenantId } = this.tenancy.getScope(req);
    const location = await this.service.deleteLocation(tenantId, id);
    return { ok: true, location };
  }
}
