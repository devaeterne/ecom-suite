"use client";

import { useEffect, useMemo, useState } from "react";
import { DropdownMenu, Button, Text } from "@medusajs/ui";
import { ChevronDown } from "@medusajs/icons";
import { useRouter } from "next/navigation";

import { AdminTenantsApi, AdminTenantListItem } from "@/src/lib/api/admin/tenant";
import { HttpError } from "@/src/lib/api/_client/http";
import { setTenantContext } from "@/src/lib/api/_client/tenant";

type Selected = { tenantId: string; tenantCode: string; name?: string; isActive?: boolean };

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
  const [items, setItems] = useState<AdminTenantListItem[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);

  // initial local selection
  useEffect(() => {
    setSelected(readSelectedFromLS());
  }, []);

  // probe super admin + load tenants
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const res = await AdminTenantsApi.list(); // 200 => super admin, 403 => normal admin
        if (!alive) return;

        const list = res?.items ?? [];
        setItems(list);
        setVisible(true);

        // selection: use LS if exists, else pick first
        const current = readSelectedFromLS();
        if (current) {
          const hit = list.find((x) => x.id === current.tenantId || x.code === current.tenantCode);
          if (hit) {
            setSelected({
              tenantId: hit.id,
              tenantCode: hit.code,
              name: hit.name,
              isActive: hit.isActive,
            });
          } else {
            // LS stale -> fallback to first
            if (list[0]) {
              const first = list[0];
              setTenantContext({ tenantId: first.id, tenantCode: first.code });
              setSelected({
                tenantId: first.id,
                tenantCode: first.code,
                name: first.name,
                isActive: first.isActive,
              });
              router.refresh();
            }
          }
        } else if (list[0]) {
          const first = list[0];
          setTenantContext({ tenantId: first.id, tenantCode: first.code });
          setSelected({
            tenantId: first.id,
            tenantCode: first.code,
            name: first.name,
            isActive: first.isActive,
          });
          router.refresh();
        }
      } catch (e) {
        if (e instanceof HttpError && e.status === 403) {
          setVisible(false);
        } else {
          setVisible(false);
        }
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
          return (
            <DropdownMenu.Item
              key={t.id}
              onClick={() => {
                setTenantContext({ tenantId: t.id, tenantCode: t.code });
                setSelected({
                  tenantId: t.id,
                  tenantCode: t.code,
                  name: t.name,
                  isActive: t.isActive,
                });

                window.location.reload();
              }}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">{t.code}</div>
                  <div className="truncate text-ui-fg-subtle text-[12px]">
                    {t.name}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!t.isActive ? (
                    <span className="text-[12px] text-ui-fg-subtle">inactive</span>
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
