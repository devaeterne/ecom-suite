import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  HttpCode,
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
  @RequirePermission("admin:identities:read")
  async list(@Req() req: any) {
    const items = await this.svc.list(req.tenant.id);
    return items.map(presentIdentity);
  }

  @Post()
  @HttpCode(200)
  @RequirePermission("admin:identities:create")
  async create(@Req() req: any, @Body() dto: IdentityCreateDto) {
    const u = await this.svc.create(req.tenant.id, dto);
    return presentIdentity(u);
  }

  // Şimdilik create ile koru (seed’de update yok, hızlı geçiş)
  @Patch(":id")
  @RequirePermission("admin:identities:create")
  async patch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: IdentityPatchDto
  ) {
    const u = await this.svc.patch(req.tenant.id, id, dto);
    return presentIdentity(u);
  }

  // Şimdilik create ile koru (seed’de invite yok)
  @Post(":id/invite")
  @RequirePermission("admin:identities:create")
  async invite(@Req() req: any, @Param("id") id: string) {
    return this.svc.invite(req.tenant.id, id);
  }
}
