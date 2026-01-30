"use client";

import { useEffect, useMemo, useState } from "react";
import { DropdownMenu, Button, Text } from "@medusajs/ui";
import { ChevronDown } from "@medusajs/icons";
import { useRouter } from "next/navigation";

import {
  AdminTenantsApi,
  AdminTenantListItem,
} from "@/src/lib/api/admin/tenant";
import { AdminMeApi } from "@/src/lib/api/auth/admin";
import { HttpError } from "@/src/lib/api/_client/http";
import { setTenantContext } from "@/src/lib/api/_client/tenant";

type Selected = {
  tenantId: string;
  tenantCode: string;
  name?: string;
  isActive?: boolean;
};

function readSelectedFromLS(): Selected | null {
  if (typeof window === "undefined") return null;

  const tenantId = window.localStorage.getItem("tenantId");
  const tenantCode = window.localStorage.getItem("tenantCode");

  if (!tenantId || !tenantCode) return null;
  if (tenantId === "undefined" || tenantId === "null") return null;
  if (tenantCode === "undefined" || tenantCode === "null") return null;

  return { tenantId, tenantCode };
}

export default function TenantSwitcher() {
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const [items, setItems] = useState<AdminTenantListItem[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);

  useEffect(() => {
    setSelected(readSelectedFromLS());
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // 1) role check (hard gate)
        const me = await AdminMeApi.meCached();
        if (!alive) return;

        if (me?.user?.role !== "super_admin") {
          setVisible(false);
          setItems([]);
          return;
        }

        // 2) super admin => load tenants
        const res = await AdminTenantsApi.list();
        if (!alive) return;

        const list = res?.items ?? [];
        setItems(list);
        setVisible(true);

        // 3) selection: LS if valid else first
        const current = readSelectedFromLS();

        if (current) {
          const hit = list.find(
            (x) => x.id === current.tenantId || x.code === current.tenantCode,
          );
          if (hit) {
            setSelected({
              tenantId: hit.id,
              tenantCode: hit.code,
              name: hit.name,
              isActive: hit.isActive,
            });
            return;
          }
        }

        // LS stale or empty -> pick first
        if (list[0]) {
          const first = list[0];
          setTenantContext({ tenantId: first.id, tenantCode: first.code });
          setSelected({
            tenantId: first.id,
            tenantCode: first.code,
            name: first.name,
            isActive: first.isActive,
          });

          // hard reload istemiyoruz; ilk açılışta refresh yeter
          router.refresh();
        }
      } catch (e) {
        // admin/me 401 vs -> auth akışın neyse; burada switcher'ı kapatalım
        if (e instanceof HttpError) {
          setVisible(false);
          setItems([]);
          return;
        }
        setVisible(false);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  const label = useMemo(() => {
    if (!selected) return "Tenant";
    const code = selected.tenantCode;
    const name = selected.name ? ` — ${selected.name}` : "";
    return `${code}${name}`;
  }, [selected]);

  if (!visible) return null;

  async function handleSelect(t: AdminTenantListItem) {
    if (selected?.tenantId === t.id) return;

    try {
      setSwitchingId(t.id);

      // 1) audit event (backend)
      await AdminTenantsApi.switchTenant({ targetTenantId: t.id });

      // 2) persist context (frontend)
      setTenantContext({ tenantId: t.id, tenantCode: t.code });

      // 3) hard reload
      window.location.reload();
    } finally {
      setSwitchingId(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="secondary"
          size="small"
          disabled={loading}
          className="max-w-[320px]"
        >
          <Text size="xsmall" className="truncate">
            {loading ? "Loading tenants…" : label}
          </Text>
          <ChevronDown className="ml-2" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" className="min-w-[340px]">
        {items.map((t) => {
          const active = selected?.tenantId === t.id;
          const busy = switchingId === t.id;

          return (
            <DropdownMenu.Item
              key={t.id}
              disabled={busy}
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                handleSelect(t);
              }}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">
                    {t.code} {busy ? "…" : ""}
                  </div>
                  <div className="truncate text-ui-fg-subtle text-[12px]">
                    {t.name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!t.isActive ? (
                    <span className="text-[12px] text-ui-fg-subtle">
                      inactive
                    </span>
                  ) : null}
                  {active ? <span className="text-[12px]">✓</span> : null}
                </div>
              </div>
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
