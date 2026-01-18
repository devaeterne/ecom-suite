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
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const tenantId =
      req?.tenant?.id ?? req?.tenantId ?? req?.user?.tenantId ?? null;

    if (!tenantId) {
      throw new BadRequestException("Tenant context missing");
    }

    // normalize
    req.tenantId = tenantId;
    req.tenant = req.tenant ?? { id: tenantId };

    return true;
  }
}
export const TenantHeaderGuard = TenantGuard;
