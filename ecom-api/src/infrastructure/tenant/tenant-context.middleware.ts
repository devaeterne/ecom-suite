import { Injectable, NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { PrismaService } from "@/prisma/prisma.service";
import { env } from "@/config/env";

function isUuid(v?: string) {
  return (
    !!v &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
}

function parseTenantFromHost(host?: string): string | undefined {
  if (!host) return undefined;
  const clean = host.split(":")[0];
  const parts = clean.split(".");
  // api.<tenant>.domain.com OR <tenant>.domain.com
  if (parts.length >= 3 && parts[0] === "api") return parts[1];
  if (parts.length >= 2) return parts[0];
  return undefined;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request & any, _res: Response, next: NextFunction) {
    // 1) Header önceliği
    const headerTenantId =
      (req.headers["x-tenant-id"] as string | undefined) ??
      (req.headers["X-Tenant-Id"] as string | undefined);

    const headerTenantCode =
      (req.headers["x-tenant-code"] as string | undefined) ??
      (req.headers["X-Tenant-Code"] as string | undefined);

    let resolvedTenant: { id: string; code?: string } | undefined;

    if (headerTenantId || headerTenantCode) {
      resolvedTenant = await this.resolveTenant(
        headerTenantId,
        headerTenantCode
      );
    }

    // 2) Host fallback
    if (!resolvedTenant) {
      const fromHost = parseTenantFromHost(req.headers?.host);
      if (fromHost) {
        resolvedTenant = await this.resolveTenant(undefined, fromHost);
      }
    }

    // 3) Token payload fallback (admin)
    // AuthGuard/AdminAuthGuard req.user set eder; burada sadece uyum kontrolü yaparız
    const tokenTenantId =
      req?.user?.tenantId ?? req?.user?.tenant?.id ?? undefined;

    if (tokenTenantId) {
      if (!resolvedTenant) {
        // header/host yoksa token’dan al
        resolvedTenant = await this.resolveTenant(tokenTenantId, undefined);
      } else if (resolvedTenant.id !== tokenTenantId) {
        // header/host ile token çelişiyorsa güvenli tarafta kal
        return next(
          Object.assign(new Error("Tenant mismatch"), { status: 403 })
        );
      }
    }

    if (resolvedTenant) {
      req.tenant = resolvedTenant;
    }

    next();
  }

  private async resolveTenant(
    id?: string,
    code?: string
  ): Promise<{ id: string; code?: string } | undefined> {
    if (id && isUuid(id)) {
      const t = await this.prisma.tenant.findFirst({
        where: { id },
        select: { id: true, code: true },
      });
      if (t) return t;
    }

    if (code) {
      const t = await this.prisma.tenant.findFirst({
        where: { code },
        select: { id: true, code: true },
      });
      if (t) return t;
    }

    return undefined;
  }
}
