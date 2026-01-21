"use client";

import { useMemo } from "react";
import { useAppSession } from "@/src/providers/app-session-provider";

type Limits = {
  productsPerStatus?: number;
  mediaPerProduct?: number;
  users?: number;
  storageMb?: number;
};

type Remaining = {
  draft?: number;
  published?: number;
  archived?: number;
};

export function useTenantEntitlements(): {
  limits: Limits;
  remaining: Remaining;
  raw: any;
} {
  const session = useAppSession();

  const raw = (session as any)?.tenantBundle ?? null;

  // Eğer AppSessionProvider içinde bundle state tutmuyorsan:
  // - fallback olarak tenant object içinde bir şey yoksa boş döner.
  const entitlements = raw?.entitlements ?? null;

  const limits = (entitlements?.limits ?? {}) as Limits;
  const remaining = (entitlements?.remaining ?? {}) as Remaining;

  return useMemo(
    () => ({
      limits,
      remaining,
      raw,
    }),
    [limits, remaining, raw],
  );
}
