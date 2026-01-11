export type NavItem = {
  href: string;
  labelKey: string;
  titleKey: string;
  subtitleKey?: string;
};

export const NAV: NavItem[] = [
  {
    href: "/dashboards",
    labelKey: "nav.dashboards",
    titleKey: "topbar.title.dashboard",
    subtitleKey: "pages.dashboards.subtitle",
  },
  {
    href: "/products",
    labelKey: "nav.products",
    titleKey: "topbar.title.products",
    subtitleKey: "pages.products.subtitle",
  },
  {
    href: "/orders",
    labelKey: "nav.orders",
    titleKey: "topbar.title.orders",
    subtitleKey: "pages.orders.subtitle",
  },
  {
    href: "/inventory",
    labelKey: "nav.inventory",
    titleKey: "topbar.title.inventory",
    subtitleKey: "pages.inventory.subtitle",
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    titleKey: "topbar.title.settings",
    subtitleKey: "pages.settings.subtitle",
  },
];

function matchesPath(pathname: string, href: string) {
  // pathname örnek: "/en/products/123" -> locale strip'i Topbar/Sidebar tarafında zaten yapıyorsun
  return pathname === href || pathname.startsWith(href + "/");
}

export function getTitleKeyFromPath(pathname: string) {
  const hit = [...NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => matchesPath(pathname, i.href));

  return hit?.titleKey ?? "topbar.title.dashboard";
}

export function getPageMetaFromPath(pathname: string) {
  const hit = [...NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => matchesPath(pathname, i.href));

  return {
    titleKey: hit?.titleKey ?? "topbar.title.dashboard",
    subtitleKey: hit?.subtitleKey,
  };
}
