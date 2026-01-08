import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { getTenantHeaderValue, isUuidLike } from "./tenant.util";

/**
 * TenantHeaderGuard:
 * - x-tenant-id header'ını okur
 * - Header UUID ise: tenantId = header
 * - Header UUID değilse: bunu tenant "code" kabul eder ve DB'den tenant.id (uuid) resolve eder
 *
 * Bu guard:
 * - req.tenantId (uuid) set eder
 * - req.tenant = { id, code? } set eder
 *
 * Not:
 * - AdminAuthGuard bazı akışlarda req.tenant.id set etmiş olabilir.
 *   Eğer ikisi çakışırsa Forbidden döner.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const headerVal = getTenantHeaderValue(req);
    if (!headerVal) throw new BadRequestException("x-tenant-id header missing");

    // 1) Eğer header UUID ise direkt tenantId kabul et
    if (isUuidLike(headerVal)) {
      const resolvedTenantId = headerVal;

      // 2) Eğer req.tenant.id varsa ve farklıysa: mismatch
      if (req.tenant?.id && req.tenant.id !== resolvedTenantId) {
        throw new ForbiddenException("Tenant mismatch");
      }

      req.tenantId = resolvedTenantId;
      req.tenant = { id: resolvedTenantId };
      return true;
    }

    // 3) UUID değilse: tenant code (örn "acme") olarak resolve et
    const tenant = await this.prisma.tenant.findFirst({
      where: { code: headerVal },
      select: { id: true, code: true },
    });

    if (!tenant) throw new BadRequestException("Invalid tenant code");

    const resolvedTenantId = tenant.id;
    const resolvedTenantCode = tenant.code;

    // 4) Eğer req.tenant.id varsa ve farklıysa: mismatch
    if (req.tenant?.id && req.tenant.id !== resolvedTenantId) {
      throw new ForbiddenException("Tenant mismatch");
    }

    // 5) Request context’e yaz
    req.tenantId = resolvedTenantId;
    req.tenant = {
      id: resolvedTenantId,
      ...(resolvedTenantCode ? { code: resolvedTenantCode } : {}),
    };

    return true;
  }
}

/**
 * Backward compatibility:
 * Projede bazı yerlerde TenantHeaderGuard import ediliyor.
 * Yeni isim: TenantGuard
 */
export const TenantHeaderGuard = TenantGuard;
