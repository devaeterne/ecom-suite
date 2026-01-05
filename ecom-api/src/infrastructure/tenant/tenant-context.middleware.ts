import { Injectable, NestMiddleware } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

function isUuid(v?: string) {
  return (
    !!v &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
}

function isLocalHost(clean: string) {
  return (
    clean === "localhost" ||
    clean === "127.0.0.1" ||
    clean === "0.0.0.0" ||
    clean === "::1"
  );
}

function parseTenantFromHost(host?: string): string | undefined {
  if (!host) return undefined;

  const clean = host.split(":")[0].toLowerCase();

  // ✅ LOCAL HOST BYPASS (dev ortamında health/docs kilitlemesin)
  if (isLocalHost(clean)) return undefined;

  // ✅ IP address ise de parse etme
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(clean) || clean.includes(":"); // ipv4 / kaba ipv6
  if (isIp) return undefined;

  const parts = clean.split(".");

  // api.<tenant>.domain.com
  if (parts.length >= 3 && parts[0] === "api") return parts[1];

  // <tenant>.domain.com
  if (parts.length >= 2) return parts[0];

  return undefined;
}

function shouldBypassTenant(url?: string) {
  if (!url) return false;
  return (
    url.startsWith("/api/health") ||
    url.startsWith("/health") ||
    url.startsWith("/api/docs") ||
    url.startsWith("/docs") ||
    url.startsWith("/api/docs-json") ||
    url.startsWith("/docs-json")
  );
}

function withTimeout<T>(p: Promise<T>, ms = 1500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Tenant resolve timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, _res: any, next: (err?: any) => void) {
    try {
      if (shouldBypassTenant(req.url)) return next();

      // 1) Header önceliği
      const headerTenantId = req.headers?.["x-tenant-id"] as string | undefined;
      const headerTenantCode = req.headers?.["x-tenant-code"] as
        | string
        | undefined;

      let resolvedTenant: { id: string; code?: string } | undefined;

      if (headerTenantId || headerTenantCode) {
        resolvedTenant = await withTimeout(
          this.resolveTenant(headerTenantId, headerTenantCode)
        );
      }

      // 2) Host fallback
      if (!resolvedTenant) {
        const fromHost = parseTenantFromHost(req.headers?.host);
        if (fromHost) {
          resolvedTenant = await withTimeout(
            this.resolveTenant(undefined, fromHost)
          );
        }
      }

      // 3) Token payload fallback (admin/store)
      const tokenTenantId = req?.user?.tenantId ?? req?.user?.tenant?.id;

      if (tokenTenantId) {
        if (!resolvedTenant) {
          resolvedTenant = await withTimeout(
            this.resolveTenant(tokenTenantId, undefined)
          );
        } else if (resolvedTenant.id !== tokenTenantId) {
          const err = Object.assign(new Error("Tenant mismatch"), {
            status: 403,
          });
          return next(err);
        }
      }

      if (resolvedTenant) req.tenant = resolvedTenant;

      return next();
    } catch (err) {
      // burada düşerse request pending yerine kontrollü 500/403'e gider
      return next(err);
    }
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
