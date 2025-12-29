import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    /**
     * Admin auth guard zaten req.user set ediyor:
     * req.user = { id, tenantId, ... }
     */
    if ((req as any).user?.tenantId) {
      (req as any).tenant = {
        id: (req as any).user.tenantId,
      };
    }

    next();
  }
}
