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
 * Sonuç:
 * - req.tenantId her zaman UUID olur (Prisma ilişkileri için güvenli)
 * - req.tenant = { id, code } set edilir
 *
 * Ek güvenlik:
 * - Eğer req.tenant zaten auth guard tarafından set edildiyse (token payload),
 *   header ile resolve edilen tenantId eşleşmek zorunda. Değilse 403.
 */
@Injectable()
export class TenantHeaderGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    // 1) Header değerini al
    const raw = getTenantHeaderValue(req);

    // Header yoksa: bazı endpointlerde tenant zorunlu (catalog/admin gibi)
    if (!raw) {
      throw new BadRequestException("Missing x-tenant-id header");
    }

    // 2) Header UUID ise direkt geç
    let resolvedTenantId: string;
    let resolvedTenantCode: string | null = null;

    if (isUuidLike(raw)) {
      resolvedTenantId = raw;
    } else {
      // 3) UUID değilse bunu "tenant code" varsayıp DB'den çöz
      // NOT: Senin schema'da "handle" yok; tenant-config’te de "code" geçiyor.
      const t = await this.prisma.tenant.findFirst({
        where: { code: raw },
        select: { id: true, code: true },
      });

      if (!t) {
        throw new BadRequestException(`Unknown tenant: ${raw}`);
      }

      resolvedTenantId = t.id;
      resolvedTenantCode = t.code;
    }

    // 4) Auth guard zaten req.tenant set ettiyse, uyuşmazlık durumunda 403
    // (örn: token tenantId = X, header başka tenant gösteriyor -> multi-tenant isolation)
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
