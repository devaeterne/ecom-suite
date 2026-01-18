import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

function isUuidLike(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

/**
 * Admin request'lerinde tenant context'i hydrate eder.
 * Öncelik:
 * 1) req.tenant.id / req.tenantId (middleware/guard set etmiş olabilir)
 * 2) JWT payload: req.user.tenantId
 * 3) Header: x-tenant-id / x-tenant-code / x-tenant
 *
 * Sonuç:
 * - req.tenant (entity)
 * - req.tenantId (uuid)
 */
@Injectable()
export class AdminTenantContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<any>();
    const h = req?.headers ?? {};

    const existingTenantId: string | undefined =
      req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId;

    const headerTenant: string | undefined =
      (h["x-tenant-id"] as string | undefined) ??
      (h["x-tenantid"] as string | undefined) ??
      (h["x-tenant-code"] as string | undefined) ??
      (h["x-tenant"] as string | undefined) ??
      (h["X-Tenant-Id"] as string | undefined) ??
      (h["X-Tenant"] as string | undefined);

    const raw = existingTenantId ?? headerTenant;
    if (!raw) throw new ForbiddenException("Tenant context missing");

    const rawStr = String(raw);

    const tenant = isUuidLike(rawStr)
      ? await this.prisma.tenant.findUnique({
          where: { id: rawStr },
          select: { id: true, code: true, name: true },
        })
      : await this.prisma.tenant.findFirst({
          where: { code: rawStr },
          select: { id: true, code: true, name: true },
        });

    if (!tenant) throw new ForbiddenException("Tenant not found");

    // mismatch enforcement: existing tenant sabitse header ile override yok
    if (existingTenantId && existingTenantId !== tenant.id) {
      throw new ForbiddenException("Tenant mismatch");
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;

    return true;
  }
}
