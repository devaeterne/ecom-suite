import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { PrismaService } from "@/prisma/prisma.service";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      // 1) Auth guard set ettiyse: tenantId zaten UUID olmalı
      const userTenantId = (req as any).user?.tenantId as string | undefined;
      if (userTenantId) {
        (req as any).tenant = { id: userTenantId };
        return next();
      }

      // 2) Header fallback: x-tenant-id
      const raw = (req.headers["x-tenant-id"] as string | undefined)?.trim();
      if (!raw) return next();

      // Header UUID ise direkt al
      if (isUuid(raw)) {
        (req as any).tenant = { id: raw };
        return next();
      }

      // Header "acme" gibi code/handle ise resolve et
      const tenant = await this.prisma.tenant.findUnique({
        where: { code: raw }, // <-- sende "handle" ise { handle: raw }
        select: { id: true },
      });

      if (!tenant) {
        throw new BadRequestException(`Unknown tenant: ${raw}`);
      }

      (req as any).tenant = { id: tenant.id };
      return next();
    } catch (e) {
      // middleware içinde throw = 500/400 davranışı app config’e göre değişebilir
      // burada next(e) daha temiz
      return next(e as any);
    }
  }
}
