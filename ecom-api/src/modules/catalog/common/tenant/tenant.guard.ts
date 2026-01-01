import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { requireTenantId } from "@/modules/catalog/common/tenant/tenant.util";

@Injectable()
export class TenantHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    // guard: header yoksa patlat
    const tenantId = requireTenantId(req.headers);
    // request içine koy, aşağı katmanlarda kullan
    req.tenantId = tenantId;
    return true;
  }
}
