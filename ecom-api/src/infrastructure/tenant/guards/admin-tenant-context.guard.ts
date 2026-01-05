// src/infrastructure/tenant-context/guards/admin-tenant-context.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * Admin request'lerinde tenant context'i hydrate eder.
 * Öncelik:
 * 1) JWT payload: req.user.tenantId
 * 2) req.tenantId (AdminAccessGuard set edebilir)
 * 3) Header: x-tenant-id / x-tenant
 *
 * Sonuç:
 * - req.tenant (entity)
 * - req.tenantId (string)
 */
@Injectable()
export class AdminTenantContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<any>();

    const h = req?.headers ?? {};

    const tenantId: string | undefined =
      req?.user?.tenantId ??
      req?.tenantId ??
      (h["x-tenant-id"] as string | undefined) ??
      (h["x-tenantid"] as string | undefined) ??
      (h["x-tenant"] as string | undefined) ??
      (h["X-Tenant-Id"] as string | undefined) ??
      (h["X-Tenant"] as string | undefined);

    if (!tenantId) {
      throw new ForbiddenException("Tenant context missing");
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: String(tenantId) },
      select: { id: true, code: true, name: true }, // ihtiyaca göre genişlet
    });

    if (!tenant) {
      throw new ForbiddenException("Tenant not found");
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;

    return true;
  }
}
