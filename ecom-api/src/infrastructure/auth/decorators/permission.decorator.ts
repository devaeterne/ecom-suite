import { SetMetadata } from "@nestjs/common";

/**
 * PermissionGuard bu key üzerinden okur.
 * Handler-level metadata, class-level metadata'yı override eder.
 */
export const REQUIRE_PERMISSION_KEY = "auth:require_permission";

export type RequiredPermission = string | string[];

/**
 * Canonical decorator.
 * Kullanım:
 *  - @RequirePermission("orders.read")
 *  - @RequirePermission(["orders.read", "orders.write"])
 */
export function RequirePermission(permission: RequiredPermission) {
  return SetMetadata(REQUIRE_PERMISSION_KEY, permission);
}

/**
 * Backward compatibility alias.
 * Eski kodda @Permission("x") gibi kullanımlar varsa kırılmasın.
 */
export const Permission = RequirePermission;
