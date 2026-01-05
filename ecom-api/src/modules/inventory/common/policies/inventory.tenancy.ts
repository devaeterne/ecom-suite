import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { TenantScope } from "../types/inventory.types";

/**
 * Bu policy, senin mevcut StoreAuth guard’ının req.user payload’ına uyarlanmalı.
 * Burada "tenantId" yoksa doğrudan Unauthorized fırlatıyoruz.
 */
@Injectable()
export class InventoryTenancyPolicy {
  getScope(req: Request): TenantScope {
    // ÖRN: req.user = { tenantId, sub/customerId, ... }
    const anyReq = req as any;
    const user = anyReq.user;

    const tenantId: string | undefined = user?.tenantId;
    if (!tenantId) throw new UnauthorizedException("TENANT_SCOPE_REQUIRED");

    const customerId: string | undefined = user?.customerId ?? user?.sub;
    return { tenantId, customerId };
  }
}
