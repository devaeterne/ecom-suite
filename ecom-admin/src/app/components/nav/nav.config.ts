export type NavItem = {
  href: string;
  labelKey: string;
  titleKey: string;
  subtitleKey?: string;
  children?: NavItem[];
};

export const NAV: NavItem[] = [
  {
    href: "/dashboards",
    labelKey: "nav.dashboards",
    titleKey: "topbar.title.dashboard",
    subtitleKey: "pages.dashboards.subtitle",
  },

  // ✅ Yeni şemsiye: Catalog
  {
    href: "/catalog",
    labelKey: "nav.catalog",
    titleKey: "topbar.title.catalog",
    subtitleKey: "pages.catalog.subtitle",
    children: [
      {
        href: "/products",
        labelKey: "nav.products",
        titleKey: "topbar.title.products",
        subtitleKey: "pages.products.subtitle",
      },
      {
        href: "/categories",
        labelKey: "nav.categories",
        titleKey: "topbar.title.categories",
        subtitleKey: "pages.categories.subtitle",
      },
      {
        href: "/collections",
        labelKey: "nav.collections",
        titleKey: "topbar.title.collections",
        subtitleKey: "pages.collections.subtitle",
      },
      {
        href: "/price-lists",
        labelKey: "nav.price_lists",
        titleKey: "topbar.title.price_lists",
        subtitleKey: "pages.price_lists.subtitle",
      },

      {
        href: "/tags",
        labelKey: "nav.tags",
        titleKey: "topbar.title.tags",
        subtitleKey: "pages.tags.subtitle",
      },
    ],
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
  return pathname === href || pathname.startsWith(href + "/");
}

function flattenNav(items: NavItem[]): NavItem[] {
  const out: NavItem[] = [];
  for (const i of items) {
    out.push(i);
    if (i.children?.length) out.push(...flattenNav(i.children));
  }
  return out;
}

export function getTitleKeyFromPath(pathname: string) {
  const flat = flattenNav(NAV);

  const hit = [...flat]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => matchesPath(pathname, i.href));

  return hit?.titleKey ?? "topbar.title.dashboard";
}

export function getPageMetaFromPath(pathname: string) {
  const flat = flattenNav(NAV);

  const hit = [...flat]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => matchesPath(pathname, i.href));

  return {
    titleKey: hit?.titleKey ?? "topbar.title.dashboard",
    subtitleKey: hit?.subtitleKey,
  };
}
