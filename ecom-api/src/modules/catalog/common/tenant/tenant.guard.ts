import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { getTenantHeaderValue, isUuidLike } from "./tenant.util";

type Panel = "admin" | "store";

function detectPanel(req: any): Panel | undefined {
  const url: string =
    req?.url ??
    req?.raw?.url ??
    req?.originalUrl ??
    req?.routeOptions?.url ??
    "";

  if (url.startsWith("/api/admin")) return "admin";
  if (url.startsWith("/api/store")) return "store";
  return undefined;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const panel = detectPanel(req);

    const headerTenant = getTenantHeaderValue(req); // uuid OR code OR undefined

    // ------------------------------------------------------------
    // 1) Admin tenant scope enforcement (beton)
    // ------------------------------------------------------------
    if (panel === "admin" && req?.user) {
      const typ = req.user?.typ; // "admin" bekliyoruz
      const role = req.user?.role; // "super_admin" | "admin"
      const userTenantId = req.user?.tenantId;

      // Yanlış context’e fail-closed
      if (typ && typ !== "admin") {
        throw new ForbiddenException("Admin tenant scope required");
      }

      // Normal admin: header override yok, tenantId sabit
      if (role !== "super_admin") {
        if (!userTenantId) throw new ForbiddenException("Tenant scope missing");

        // Header ile başka tenant'a geçme girişimi -> 403
        if (headerTenant) {
          // uuid header farklıysa
          if (
            isUuidLike(headerTenant) &&
            String(headerTenant) !== String(userTenantId)
          ) {
            throw new ForbiddenException("Cross-tenant access denied");
          }
          // code header (uuid değil) her durumda deny (override denemesi)
          if (!isUuidLike(headerTenant)) {
            throw new ForbiddenException("Cross-tenant access denied");
          }
        }

        // Sabitle
        req.tenantId = userTenantId;
        req.tenant = { id: userTenantId };
        return true;
      }
    }

    // ------------------------------------------------------------
    // 2) Super admin / store / anonymous: tenant resolve
    // ------------------------------------------------------------
    const existingTenantId =
      req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId ?? null;

    let resolvedTenantId: string | null = existingTenantId;

    if (headerTenant) {
      if (isUuidLike(headerTenant)) {
        resolvedTenantId = headerTenant;
        req.tenant = { id: headerTenant };
      } else {
        const t = await this.prisma.tenant.findFirst({
          where: { code: headerTenant, deletedAt: null },
          select: { id: true, code: true },
        });

        if (!t?.id) throw new BadRequestException("Tenant not found");

        resolvedTenantId = t.id;
        req.tenant = { id: t.id, code: t.code };
      }
    }

    if (!resolvedTenantId) {
      throw new BadRequestException("Tenant context missing");
    }

    // normalize
    req.tenantId = resolvedTenantId;
    req.tenant = req.tenant ?? { id: resolvedTenantId };

    return true;
  }
}

export const TenantHeaderGuard = TenantGuard;
