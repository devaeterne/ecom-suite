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
  UnauthorizedException,
} from "@nestjs/common";
import { AdminAuthGuard } from "@/infrastructure/auth/guards/admin-auth.guard";
import { PermissionGuard } from "@/infrastructure/auth/guards/permission.guard";
import { RequirePermission } from "@/infrastructure/auth/decorators/permission.decorator";
import { IdentitiesService } from "@/modules/admin/identities/admin/services/identities.service";
import { IdentityCreateDto } from "@/modules/admin/identities/common/dto/identity-create.dto";
import { IdentityPatchDto } from "@/modules/admin/identities/common/dto/identity-patch.dto";
import { presentIdentity } from "@/modules/admin/identities/common/mappers/identity.presenter";
import { TenantGuard } from "@/modules/catalog/common/tenant/tenant.guard";

function requireTenantId(req: any): string {
  const tenantId = req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId;
  if (!tenantId) throw new UnauthorizedException("Tenant context missing");
  return String(tenantId);
}

@Controller("admin/identities")
@UseGuards(AdminAuthGuard, TenantGuard, PermissionGuard)
export class IdentitiesAdminController {
  constructor(private readonly svc: IdentitiesService) {}

  @Get()
  @RequirePermission("admin:identities:read")
  async list(@Req() req: any) {
    const tenantId = requireTenantId(req);
    const items = await this.svc.list(tenantId);
    return items.map(presentIdentity);
  }

  @Post()
  @HttpCode(200) // P1: 201
  @RequirePermission("admin:identities:create")
  async create(@Req() req: any, @Body() dto: IdentityCreateDto) {
    const tenantId = requireTenantId(req);
    const u = await this.svc.create(tenantId, dto);
    return presentIdentity(u);
  }

  @Patch(":id")
  @RequirePermission("admin:identities:create") // P1: identities:update
  async patch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: IdentityPatchDto,
  ) {
    const tenantId = requireTenantId(req);
    const u = await this.svc.patch(tenantId, id, dto);
    return presentIdentity(u);
  }

  @Post(":id/invite")
  @RequirePermission("admin:identities:write") // P1: identities:invite
  async invite(@Req() req: any, @Param("id") userId: string) {
    const tenantId = requireTenantId(req);
    return this.svc.invite(tenantId, userId);
  }
}
