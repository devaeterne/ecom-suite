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
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";
import { IdentitiesService } from "@/modules/admin/identities/identities.service";
import { IdentityCreateDto } from "@/modules/admin/dto/identity-create.dto";
import { IdentityPatchDto } from "@/modules/admin/dto/identity-patch.dto";
import { presentIdentity } from "@/modules/admin/mappers/identity.presenter";

@Controller("admin/identities")
@UseGuards(AdminAuthGuard, PermissionGuard)
export class IdentitiesAdminController {
  constructor(private readonly svc: IdentitiesService) {}

  @Get()
  @RequirePermission("identity:read")
  async list(@Req() req: any) {
    const items = await this.svc.list(req.tenant.id);
    return items.map(presentIdentity);
  }

  @Post()
  @RequirePermission("identity:write")
  async create(@Req() req: any, @Body() dto: IdentityCreateDto) {
    const u = await this.svc.create(req.tenant.id, dto);
    return presentIdentity(u);
  }

  @Patch(":id")
  @RequirePermission("identity:write")
  async patch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: IdentityPatchDto
  ) {
    const u = await this.svc.patch(req.tenant.id, id, dto);
    return presentIdentity(u);
  }

  @Post(":id/invite")
  @RequirePermission("identity:write")
  async invite(@Req() req: any, @Param("id") id: string) {
    return this.svc.invite(req.tenant.id, id);
  }
}
