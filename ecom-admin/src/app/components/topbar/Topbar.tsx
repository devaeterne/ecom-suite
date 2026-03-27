"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import { Button, DropdownMenu, Text } from "@medusajs/ui";
import { Moon, Sun, EllipsisHorizontal } from "@medusajs/icons";
import { Menu } from "lucide-react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useT } from "@/i18n/use-t";
import { getPageMetaFromPath } from "@/components/nav/nav.config";

import { AdminAuthApi, AdminMeApi } from "@/src/lib/api/auth/admin";
import { clearTenantContext } from "@/src/lib/api/_client/tenant";
import TenantSwitcher from "@/components/tenant/TenantSwitcher";

type TopbarProps = {
  onToggleSidebar?: () => void;
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const t = useT();

  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  const normalized = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  const { titleKey } = getPageMetaFromPath(normalized);

  async function logout() {
    try {
      await AdminAuthApi.logout();
    } finally {
      AdminMeApi.invalidate();
      clearTenantContext();
      router.replace(`/${locale}/login`);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-ui-border-base bg-ui-bg-base px-4 md:px-6">
      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-ui-bg-subtle"
          aria-label={t("common.menu")}
        >
          <Menu className="h-4 w-4" />
        </button>

        <Text size="xsmall" className="text-ui-fg-subtle hidden sm:block">
          {t("topbar.scope")}
        </Text>

        <span className="hidden sm:block h-4 w-px bg-ui-border-base" />

        <Text
          size="small"
          weight="plus"
          className="truncate max-w-[60vw] sm:max-w-none"
        >
          {t(titleKey)}
        </Text>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">
        {/* ✅ tenant switcher (super admin only via probe) */}
        <TenantSwitcher />

        {/* theme toggle */}
        <Button variant="secondary" size="small" onClick={toggle}>
          {theme === "light" ? <Moon /> : <Sun />}
          <span className="ml-2 hidden sm:inline">
            {theme === "light"
              ? t("topbar.theme.dark")
              : t("topbar.theme.light")}
          </span>
        </Button>

        {/* menu */}
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="secondary" size="small">
              <EllipsisHorizontal />
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content align="end">
            <DropdownMenu.Item>{t("topbar.menu.profile")}</DropdownMenu.Item>
            <DropdownMenu.Item>
              {t("topbar.menu.account_settings")}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item className="text-red-600" onClick={logout}>
              {t("auth.logout")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  );
}
