"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Text, clx } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { NAV, type NavItem } from "@/components/nav/nav.config";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

type Props = {
  collapsed: boolean;
  onToggleCollapsed: () => void;

  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function isActive(pathname: string, locale: string, href: string) {
  const fullHref = `/${locale}${href}`;
  return pathname === fullHref || pathname.startsWith(fullHref + "/");
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const t = useT();
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const locale = params?.locale ?? "en";

  const renderLink = (item: NavItem, depth = 0) => {
    const active = isActive(pathname, locale, item.href);
    const fullHref = `/${locale}${item.href}`;

    return (
      <Link
        key={item.href}
        href={fullHref}
        onClick={() => onCloseMobile()} // mobile: navigate -> close
        className={clx(
          "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          "text-ui-fg-subtle hover:bg-ui-bg-subtle hover:text-ui-fg-base",
          active && "bg-ui-bg-subtle text-ui-fg-base",
          depth > 0 && !collapsed && "ml-4",
        )}
        title={collapsed ? t(item.labelKey) : undefined}
      >
        <span
          className={clx(
            "h-2 w-2 rounded-full transition-opacity shrink-0",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
          )}
        />
        {!collapsed ? (
          <span className="truncate">{t(item.labelKey)}</span>
        ) : null}
      </Link>
    );
  };

  const renderGroup = (item: NavItem) => {
    const hasChildren = !!item.children?.length;
    if (!hasChildren) return renderLink(item);

    const anyChildActive = item.children!.some((c) =>
      isActive(pathname, locale, c.href),
    );

    return (
      <div key={item.href} className="pt-2">
        {!collapsed ? (
          <div className="px-3 pb-1">
            <Text
              size="xsmall"
              className={clx(
                "uppercase tracking-wide",
                anyChildActive ? "text-ui-fg-base" : "text-ui-fg-subtle",
              )}
            >
              {t(item.labelKey)}
            </Text>
          </div>
        ) : (
          <div className="px-3 pb-1">
            <div
              className={clx(
                "h-px w-full",
                anyChildActive ? "bg-ui-border-strong" : "bg-ui-border-base",
              )}
            />
          </div>
        )}

        <div className="space-y-1">
          {item.children!.map((c) => renderLink(c, 1))}
        </div>
      </div>
    );
  };

  // Desktop (md+): collapsible
  const desktop = (
    <aside
      className={clx(
        "hidden md:flex md:flex-col border-r border-ui-border-base bg-ui-bg-base py-4",
        collapsed ? "w-16" : "w-64",
        "transition-[width] duration-200 ease-out",
      )}
    >
      <div className="flex items-start justify-between gap-2 px-3 py-2">
        <div className={clx("min-w-0", collapsed && "hidden")}>
          <Text size="small" weight="plus">
            {t("brand.name")}
          </Text>
          <Text size="xsmall" className="text-ui-fg-subtle">
            {t("brand.subtitle")}
          </Text>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className={clx(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border",
            "hover:bg-ui-bg-subtle",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className={clx("mt-4 space-y-1", collapsed ? "px-1" : "px-3")}>
        {NAV.map(renderGroup)}
      </div>
    </aside>
  );

  // Mobile: drawer
  const mobile = (
    <>
      <div
        className={clx(
          "fixed inset-0 z-40 bg-black/40 md:hidden",
          mobileOpen ? "block" : "hidden",
        )}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={clx(
          "fixed left-0 top-0 z-50 h-dvh w-72 border-r border-ui-border-base bg-ui-bg-base md:hidden",
          "transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-2 px-4 py-4 border-b">
          <div className="min-w-0">
            <Text size="small" weight="plus">
              {t("brand.name")}
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {t("brand.subtitle")}
            </Text>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-ui-bg-subtle"
            aria-label="Close sidebar"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 py-3 space-y-1 overflow-auto">
          {NAV.map(renderGroup)}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}
