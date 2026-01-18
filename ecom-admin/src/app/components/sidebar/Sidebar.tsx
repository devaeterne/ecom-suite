"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Text, clx } from "@medusajs/ui";
import { useT } from "@/i18n/use-t";
import { NAV, type NavItem } from "@/components/nav/nav.config";

function isActive(pathname: string, locale: string, href: string) {
  const fullHref = `/${locale}${href}`;
  return pathname === fullHref || pathname.startsWith(fullHref + "/");
}

export default function Sidebar() {
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
        className={clx(
          "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          "text-ui-fg-subtle hover:bg-ui-bg-subtle hover:text-ui-fg-base",
          active && "bg-ui-bg-subtle text-ui-fg-base",
          depth > 0 && "ml-4",
        )}
      >
        <span
          className={clx(
            "h-2 w-2 rounded-full transition-opacity",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
          )}
        />
        <span className="truncate">{t(item.labelKey)}</span>
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

        <div className="space-y-1">
          {item.children!.map((c) => renderLink(c, 1))}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-ui-border-base bg-ui-bg-base px-3 py-4">
      <div className="px-3 py-2">
        <Text size="small" weight="plus">
          {t("brand.name")}
        </Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("brand.subtitle")}
        </Text>
      </div>

      <div className="mt-4 space-y-1">{NAV.map(renderGroup)}</div>
    </aside>
  );
}
